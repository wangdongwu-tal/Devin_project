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
    } catch (error) {
      console.error('[Consumer] Error during validation:', error);
      return false;
    }
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
  return consumer;
}
