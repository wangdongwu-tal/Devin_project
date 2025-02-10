"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const consumer_1 = require("./services/consumer");
dotenv_1.default.config();
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = process.env.QUEUE_NAME || 'task_queue';
async function handleQuoteResponse(quoteResponse) {
    // This handler will be replaced with actual implementation later
    console.log('[Handler] Processing QuoteResponse:', quoteResponse);
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('[Handler] QuoteResponse processed successfully');
}
async function main() {
    try {
        console.log('[Consumer] Starting...');
        const consumer = await (0, consumer_1.createConsumer)(RABBITMQ_URL, QUEUE_NAME, handleQuoteResponse);
        // Keep the process running
        process.on('SIGTERM', async () => {
            await consumer.close();
        });
    }
    catch (error) {
        console.error('[Consumer] Error:', error);
    }
}
main();
