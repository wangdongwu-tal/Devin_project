import dotenv from 'dotenv';
import { createConsumer } from './services/consumer';
import { QuoteResponse } from '@7kprotocol/sdk-ts';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = process.env.QUEUE_NAME || 'task_queue';

async function handleQuoteResponse(quoteResponse: QuoteResponse): Promise<void> {
  // This handler will be replaced with actual implementation later
  console.log('[Handler] Processing QuoteResponse:', quoteResponse);
  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('[Handler] QuoteResponse processed successfully');
}

async function main() {
  try {
    console.log('[Consumer] Starting...');
    const consumer = await createConsumer(RABBITMQ_URL, QUEUE_NAME, handleQuoteResponse);
    
    // Keep the process running
    process.on('SIGTERM', async () => {
      await consumer.close();
    });
  } catch (error) {
    console.error('[Consumer] Error:', error);
  }
}

main();
