import { MessageQueueService } from './messageQueue';
import { QuoteResponse } from '@7kprotocol/sdk-ts';

export class ProducerService {
  private queueService: MessageQueueService;
  private queueName: string;

  constructor(rabbitmqUrl: string, queueName: string) {
    this.queueService = new MessageQueueService(rabbitmqUrl);
    this.queueName = queueName;
  }

  async initialize(): Promise<void> {
    await this.queueService.connect();
    const channel = this.queueService.getChannel();
    await channel.assertQueue(this.queueName, {
      durable: true
    });
  }

  async sendQuoteResponse(quoteResponse: QuoteResponse): Promise<void> {
    try {
      const channel = this.queueService.getChannel();
      const messageBuffer = Buffer.from(JSON.stringify(quoteResponse));
      
      await channel.sendToQueue(this.queueName, messageBuffer, {
        persistent: true
      });
      
      console.log(`[Producer] Sent QuoteResponse to queue ${this.queueName}`);
    } catch (error) {
      console.error('[Producer] Error sending QuoteResponse:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.queueService.close();
  }
}

export async function createProducer(rabbitmqUrl: string, queueName: string): Promise<ProducerService> {
  const producer = new ProducerService(rabbitmqUrl, queueName);
  await producer.initialize();
  return producer;
}
