"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProducerService = void 0;
exports.createProducer = createProducer;
const messageQueue_1 = require("./messageQueue");
class ProducerService {
    queueService;
    queueName;
    constructor(rabbitmqUrl, queueName) {
        this.queueService = new messageQueue_1.MessageQueueService(rabbitmqUrl);
        this.queueName = queueName;
    }
    async initialize() {
        await this.queueService.connect();
        const channel = this.queueService.getChannel();
        await channel.assertQueue(this.queueName, {
            durable: true
        });
    }
    async sendQuoteResponse(quoteResponse) {
        try {
            const channel = this.queueService.getChannel();
            const messageBuffer = Buffer.from(JSON.stringify(quoteResponse));
            await channel.sendToQueue(this.queueName, messageBuffer, {
                persistent: true
            });
            console.log(`[Producer] Sent QuoteResponse to queue ${this.queueName}`);
        }
        catch (error) {
            console.error('[Producer] Error sending QuoteResponse:', error);
            throw error;
        }
    }
    async close() {
        await this.queueService.close();
    }
}
exports.ProducerService = ProducerService;
async function createProducer(rabbitmqUrl, queueName) {
    const producer = new ProducerService(rabbitmqUrl, queueName);
    await producer.initialize();
    return producer;
}
