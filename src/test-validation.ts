import { QuoteResponse } from '@7kprotocol/sdk-ts';
import { createProducer } from './services/producer';
import { createConsumer } from './services/consumer';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = process.env.QUEUE_NAME || 'quote_response_queue';

// Create mock QuoteResponse objects
function createValidQuoteResponse(): QuoteResponse {
    return {
        tokenIn: "0x2::sui::SUI",
        tokenOut: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
        amountIn: "1000000000",
        effectivePrice: "1.5",
        effectivePriceReserved: "1.49",
        priceImpact: "0.001",
        swapAmount: "1000000000",
        swapAmountWithDecimal: "1.0",
        minSwapAmount: "995000000",
        returnAmount: "1490000000",
        returnAmountWithDecimal: "1.49",
        sources: ["suiswap"],
        routes: [
            {
                source: "suiswap",
                tokenIn: "0x2::sui::SUI",
                tokenOut: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
                amountIn: "1000000000",
                amountOut: "1490000000"
            }
        ],
        timestamp: new Date().toISOString()
    } as unknown as QuoteResponse;
}

function createInvalidQuoteResponse(): QuoteResponse {
    return {
        tokenIn: "invalid_token",
        tokenOut: "invalid_token",
        amountIn: "-1",
        routes: [], // Empty routes array to trigger validation error
        timestamp: new Date().toISOString()
    } as unknown as QuoteResponse;
}

async function runValidationTests() {
    console.log('Starting validation tests...');
    
    try {
        // Start RabbitMQ
        await new Promise((resolve, reject) => {
            const docker = require('child_process').exec(
                'docker stop rabbitmq || true && docker rm rabbitmq || true && ' +
                'docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:management',
                (error: any) => error ? reject(error) : resolve(true)
            );
        });

        console.log('Waiting for RabbitMQ to initialize...');
        await new Promise(resolve => setTimeout(resolve, 20000));

        // Initialize consumer
        console.log('Starting consumer...');
        let processedMessages = 0;
        let validationErrors = 0;
        
        const consumer = await createConsumer(RABBITMQ_URL, QUEUE_NAME, async (quoteResponse: QuoteResponse) => {
            console.log('Processing message:', quoteResponse);
            processedMessages++;
            await new Promise(resolve => setTimeout(resolve, 500));
        });

        // Create producer
        const producer = await createProducer(RABBITMQ_URL, QUEUE_NAME);

        // Test 1: Valid QuoteResponse
        console.log('\nTest 1: Sending valid QuoteResponse');
        await producer.sendQuoteResponse(createValidQuoteResponse());
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Test 2: Invalid QuoteResponse
        console.log('\nTest 2: Sending invalid QuoteResponse');
        await producer.sendQuoteResponse(createInvalidQuoteResponse());
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Test 3: Network error simulation
        console.log('\nTest 3: Testing network error handling');
        await new Promise((resolve, reject) => {
            const docker = require('child_process').exec(
                'docker restart rabbitmq && sleep 10',
                (error: any) => error ? reject(error) : resolve(true)
            );
        });

        // Create new producer after network error
        const newProducer = await createProducer(RABBITMQ_URL, QUEUE_NAME);
        
        // Test 4: Send valid message after network recovery
        console.log('\nTest 4: Sending valid QuoteResponse after network recovery');
        await newProducer.sendQuoteResponse(createValidQuoteResponse());
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Cleanup
        console.log('\nCleaning up...');
        await newProducer.close();
        await consumer.close();
        
        await new Promise((resolve, reject) => {
            const docker = require('child_process').exec(
                'docker stop rabbitmq && docker rm rabbitmq',
                (error: any) => error ? reject(error) : resolve(true)
            );
        });

        console.log('\nTest Results:');
        console.log(`Processed Messages: ${processedMessages}`);
        console.log(`Validation Errors: ${validationErrors}`);
        
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

runValidationTests().catch(console.error);
