"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsumerService = void 0;
exports.createConsumer = createConsumer;
const messageQueue_1 = require("./messageQueue");
const client_1 = require("@mysten/sui/client");
const sdk_ts_1 = require("@7kprotocol/sdk-ts");
class ConsumerService {
    queueService;
    queueName;
    channel = null;
    suiClient;
    // Constants for validation retry
    MAX_VALIDATION_RETRIES = 3;
    VALIDATION_RETRY_DELAY = 1000; // ms
    constructor(rabbitmqUrl, queueName) {
        this.queueService = new messageQueue_1.MessageQueueService(rabbitmqUrl);
        this.queueName = queueName;
        // Initialize Sui Client for mainnet
        this.suiClient = new client_1.SuiClient({ url: (0, client_1.getFullnodeUrl)('mainnet') });
        (0, sdk_ts_1.setSuiClient)(this.suiClient);
    }
    async initialize() {
        await this.queueService.connect();
        this.channel = this.queueService.getChannel();
        await this.channel.assertQueue(this.queueName, {
            durable: true
        });
        await this.channel.prefetch(1);
    }
    async validateQuoteResponse(quoteResponse) {
        try {
            console.log('[Consumer] Starting QuoteResponse validation');
            // Build transaction for validation
            const result = await (0, sdk_ts_1.buildTx)({
                quoteResponse,
                accountAddress: "0x0", // Dummy address for validation
                slippage: 0.01, // 1% slippage as per SDK examples
                commission: {
                    partner: "0x0", // Dummy partner address for validation
                    commissionBps: 0,
                },
            });
            if (!result?.tx) {
                console.error('[Consumer] Failed to build transaction');
                return false;
            }
            // Validate transaction using devInspectTransactionBlock
            const inspectResult = await this.suiClient.devInspectTransactionBlock({
                transactionBlock: result.tx,
                sender: "0x0"
            });
            if (inspectResult.error) {
                console.error('[Consumer] Transaction validation failed:', inspectResult.error);
                return false;
            }
            console.log('[Consumer] QuoteResponse validation successful');
            return true;
        }
        catch (error) {
            console.error('[Consumer] Error during validation:', error);
            return false;
        }
    }
    async retryValidation(quoteResponse) {
        for (let i = 0; i < this.MAX_VALIDATION_RETRIES; i++) {
            console.log(`[Consumer] Validation attempt ${i + 1}/${this.MAX_VALIDATION_RETRIES}`);
            try {
                const isValid = await this.validateQuoteResponse(quoteResponse);
                if (isValid) {
                    console.log('[Consumer] Validation succeeded on retry');
                    return true;
                }
                if (i < this.MAX_VALIDATION_RETRIES - 1) {
                    console.log(`[Consumer] Waiting ${this.VALIDATION_RETRY_DELAY}ms before next retry`);
                    await new Promise(resolve => setTimeout(resolve, this.VALIDATION_RETRY_DELAY));
                }
            }
            catch (error) {
                console.error(`[Consumer] Error during validation retry ${i + 1}:`, error);
                if (i < this.MAX_VALIDATION_RETRIES - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.VALIDATION_RETRY_DELAY));
                }
            }
        }
        console.error('[Consumer] All validation retries failed');
        return false;
    }
    async startConsuming(messageHandler) {
        if (!this.channel) {
            throw new Error('Consumer not initialized. Call initialize() first.');
        }
        console.log(`[Consumer] Started listening on queue: ${this.queueName}`);
        await this.channel.consume(this.queueName, async (msg) => {
            if (!msg)
                return;
            try {
                const content = JSON.parse(msg.content.toString());
                console.log(`[Consumer] Received QuoteResponse:`, content);
                // Validate the QuoteResponse with retries
                const isValid = await this.retryValidation(content);
                if (!isValid) {
                    console.error('[Consumer] QuoteResponse validation failed after retries, rejecting message');
                    this.channel?.nack(msg, false, false); // Don't requeue invalid messages
                    return;
                }
                // Process the message if validation succeeds
                await messageHandler(content);
                this.channel?.ack(msg);
            }
            catch (error) {
                console.error('[Consumer] Error processing QuoteResponse:', error);
                // Requeue on processing errors (not validation errors)
                this.channel?.nack(msg, false, true);
            }
        });
    }
    async close() {
        await this.queueService.close();
    }
}
exports.ConsumerService = ConsumerService;
async function createConsumer(rabbitmqUrl, queueName, messageHandler) {
    const consumer = new ConsumerService(rabbitmqUrl, queueName);
    await consumer.initialize();
    await consumer.startConsuming(messageHandler);
    return consumer;
}
