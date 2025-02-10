"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const producer_1 = require("./services/producer");
const consumer_1 = require("./services/consumer");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = process.env.QUEUE_NAME || 'quote_response_queue';
async function createMockQuoteResponse(index) {
    // Create a basic object that will be cast to QuoteResponse
    // In production, this will be a real QuoteResponse from the SDK
    return {
        tokenIn: "0x2::sui::SUI",
        tokenOut: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
        amountIn: "1000000000",
        source: `producer-${index}`, // For testing only
        timestamp: new Date().toISOString()
    };
}
async function runTest() {
    console.log('Starting RabbitMQ test...');
    // Start RabbitMQ container if not running
    try {
        await new Promise((resolve, reject) => {
            const docker = require('child_process').exec('docker stop rabbitmq || true && docker rm rabbitmq || true && ' +
                'docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:management', (error) => error ? reject(error) : resolve(true));
        });
    }
    catch (error) {
        console.log('Error managing RabbitMQ container:', error);
        process.exit(1);
    }
    // Wait for RabbitMQ to start
    console.log('Waiting for RabbitMQ to initialize...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    try {
        // Start consumer
        console.log('Starting consumer...');
        const consumer = await (0, consumer_1.createConsumer)(RABBITMQ_URL, QUEUE_NAME, async (message) => {
            console.log('Consumer received message:', JSON.stringify(message, null, 2));
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
            console.log(`Processed message from source: ${message.source}`);
        });
        // Create multiple producers (simulating different servers)
        const producerCount = 3;
        const producers = await Promise.all(Array(producerCount).fill(0).map(async (_, index) => {
            const producer = await (0, producer_1.createProducer)(RABBITMQ_URL, QUEUE_NAME);
            console.log(`Producer ${index + 1} created`);
            return producer;
        }));
        // Send test messages from each producer
        for (let i = 0; i < producerCount; i++) {
            const mockMessage = await createMockQuoteResponse(i + 1);
            await producers[i].sendQuoteResponse(mockMessage);
            console.log(`Producer ${i + 1} sent message`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        // Wait for processing
        console.log('Waiting for messages to be processed...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Cleanup
        console.log('Cleaning up...');
        await Promise.all(producers.map(p => p.close()));
        await consumer.close();
        await new Promise((resolve, reject) => {
            const docker = require('child_process').exec('docker stop rabbitmq && docker rm rabbitmq', (error) => error ? reject(error) : resolve(true));
        });
        console.log('Test completed successfully');
    }
    catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}
runTest().catch(console.error);
