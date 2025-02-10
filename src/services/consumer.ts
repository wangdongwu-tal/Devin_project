import { MessageQueueService } from './messageQueue';
import { Channel, ConsumeMessage } from 'amqplib';
import { QuoteResponse } from '@7kprotocol/sdk-ts';
import { buildTx, setSuiClient } from '@7kprotocol/sdk-ts';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

export class ConsumerService {
  private queueService: MessageQueueService;
  private queueName: string;
  private channel: Channel | null = null;
  private suiClient: SuiClient;

  constructor(rabbitmqUrl: string, queueName: string) {
    this.queueService = new MessageQueueService(rabbitmqUrl);
    this.queueName = queueName;
    
    // Initialize Sui Client
    const network = "mainnet";
    this.suiClient = new SuiClient({ url: getFullnodeUrl(network) });
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
      // Build transaction for validation
      const result = await buildTx({
        quoteResponse,
        accountAddress: "0x0", // Dummy address for validation
        slippage: 0.01,
        commission: {
          partner: "0x0", // Dummy partner address for validation
          commissionBps: 0,
        },
      });

      if (!result || !result.tx) {
        console.error('[Consumer] Failed to build transaction for validation');
        return false;
      }

      // Perform devInspectTransactionBlock
      const inspectResult = await this.suiClient.devInspectTransactionBlock({
        transactionBlock: result.tx,
        sender: "0x0" // Dummy sender for validation
      });

      // Check if the transaction would be successful
      return !inspectResult.error;
    } catch (error) {
      console.error('[Consumer] Error validating QuoteResponse:', error);
      return false;
    }
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

        // Validate the QuoteResponse using devInspectTransactionBlock
        const isValid = await this.validateQuoteResponse(content);
        
        if (!isValid) {
          console.error('[Consumer] QuoteResponse validation failed, rejecting message');
          this.channel?.nack(msg, false, false); // Don't requeue invalid messages
          return;
        }

        // Process the message if validation succeeds
        await messageHandler(content);
        this.channel?.ack(msg);
      } catch (error) {
        console.error('[Consumer] Error processing QuoteResponse:', error);
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
