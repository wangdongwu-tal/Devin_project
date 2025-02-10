import { MessageQueueService } from './messageQueue';
import { Channel, ConsumeMessage } from 'amqplib';
import { QuoteResponse } from '@7kprotocol/sdk-ts';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { buildTx, setSuiClient } from '@7kprotocol/sdk-ts';

export class ConsumerService {
  private queueService: MessageQueueService;
  private queueName: string;
  private channel: Channel | null = null;
  private suiClient: SuiClient;

  // Constants for validation retry
  private readonly MAX_VALIDATION_RETRIES = 3;
  private readonly VALIDATION_RETRY_DELAY = 1000; // ms

  constructor(rabbitmqUrl: string, queueName: string) {
    this.queueService = new MessageQueueService(rabbitmqUrl);
    this.queueName = queueName;
    
    // Initialize Sui Client for mainnet
    this.suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });
    setSuiClient(this.suiClient);
  }

  async initialize(): Promise<void> {
    await this.queueService.connect();
    this.channel = this.queueService.getChannel();
    
    await this.channel.assertQueue(this.queueName, {
      durable: true
    });

    await this.channel.prefetch(1);
  }

  async validateQuoteResponse(quoteResponse: QuoteResponse): Promise<boolean> {
    try {
      console.log('[Consumer] Starting QuoteResponse validation');
      
      // Build transaction for validation
      const result = await buildTx({
        quoteResponse,
        accountAddress: "0x0000000000000000000000000000000000000000000000000000000000000000",
        slippage: 0.01,
      });

      if (!result?.tx) {
        console.error('[Consumer] Failed to build transaction');
        return false;
      }

      // Validate transaction using devInspectTransactionBlock
      const inspectResult = await this.suiClient.devInspectTransactionBlock({
        transactionBlock: result.tx,
        sender: "0x0000000000000000000000000000000000000000000000000000000000000000"
      });

      // Check if the transaction would be executable
      if (inspectResult.error) {
        console.error('[Consumer] Transaction validation failed:', inspectResult.error);
        return false;
      }

      console.log('[Consumer] QuoteResponse validation successful');
      return true;
    } catch (error) {
      console.error('[Consumer] Error during validation:', error);
      return false;
    }
  }

  async retryValidation(quoteResponse: QuoteResponse): Promise<boolean> {
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
      } catch (error) {
        console.error(`[Consumer] Error during validation retry ${i + 1}:`, error);
        if (i < this.MAX_VALIDATION_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, this.VALIDATION_RETRY_DELAY));
        }
      }
    }
    
    console.error('[Consumer] All validation retries failed');
    return false;
  }

  async startConsuming(messageHandler: (quoteResponse: QuoteResponse) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('Consumer not initialized. Call initialize() first.');
    }

    console.log(`[Consumer] Started listening on queue: ${this.queueName}`);

    await this.channel.consume(this.queueName, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString()) as QuoteResponse;
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
      } catch (error) {
        console.error('[Consumer] Error processing QuoteResponse:', error);
        // Requeue on processing errors (not validation errors)
        this.channel?.nack(msg, false, true);
      }
    });
  }

  async close(): Promise<void> {
    await this.queueService.close();
  }
}

export async function createConsumer(
  rabbitmqUrl: string, 
  queueName: string, 
  messageHandler: (quoteResponse: QuoteResponse) => Promise<void>
): Promise<ConsumerService> {
  const consumer = new ConsumerService(rabbitmqUrl, queueName);
  await consumer.initialize();
  await consumer.startConsuming(messageHandler);
  return consumer;
}
