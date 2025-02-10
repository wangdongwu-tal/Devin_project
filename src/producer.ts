import dotenv from 'dotenv';
import { createProducer } from './services/producer';
import { QuoteResponse } from '@7kprotocol/sdk-ts';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = process.env.QUEUE_NAME || 'task_queue';

async function main() {
  try {
    const producer = await createProducer(RABBITMQ_URL, QUEUE_NAME);
    
    // Example QuoteResponse - this will be replaced with actual data later
    const quoteResponse: QuoteResponse = {
      // We'll need to fill this with proper QuoteResponse data
      // This is just a placeholder until we get the actual structure
    } as QuoteResponse;

    await producer.sendQuoteResponse(quoteResponse);
    console.log('QuoteResponse sent successfully');
    
    await producer.close();
  } catch (error) {
    console.error('Error in producer:', error);
    process.exit(1);
  }
}

main();
