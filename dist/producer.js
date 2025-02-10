"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const producer_1 = require("./services/producer");
dotenv_1.default.config();
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = process.env.QUEUE_NAME || 'task_queue';
async function main() {
    try {
        const producer = await (0, producer_1.createProducer)(RABBITMQ_URL, QUEUE_NAME);
        // Example QuoteResponse - this will be replaced with actual data later
        const quoteResponse = {
        // We'll need to fill this with proper QuoteResponse data
        // This is just a placeholder until we get the actual structure
        };
        await producer.sendQuoteResponse(quoteResponse);
        console.log('QuoteResponse sent successfully');
        await producer.close();
    }
    catch (error) {
        console.error('Error in producer:', error);
        process.exit(1);
    }
}
main();
