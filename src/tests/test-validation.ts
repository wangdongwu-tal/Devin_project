import { QuoteResponse } from '@7kprotocol/sdk-ts';
import { createProducer } from ../../services/producer';
import { createConsumer } from ../../services/consumer';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = process.env.QUEUE_NAME || 'quote_response_queue';
const VALID_PARTNER_ADDRESS = "0x6f1b4d1c2e3b4a5d6c7b8a9f0e1d2c3b4a5d6c7b";

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
    let consumer: any = null;
    let producer: any = null;
    
    try {
        // Initialize consumer
        console.log('Starting consumer...');
        let processedMessages = 0;
        let validationErrors = 0;
        
        consumer = await createConsumer(RABBITMQ_URL, QUEUE_NAME, async (quoteResponse: QuoteResponse) => {
            console.log('Processing message:', quoteResponse);
            processedMessages++;
            await new Promise(resolve => setTimeout(resolve, 500));
        });

        // Create producer
        producer = await createProducer(RABBITMQ_URL, QUEUE_NAME);

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
        await producer.close();
        producer = await createProducer(RABBITMQ_URL, QUEUE_NAME);
        await producer.sendQuoteResponse(createValidQuoteResponse());
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('\nTest Results:');
        console.log(`Processed Messages: ${processedMessages}`);
        console.log(`Validation Errors: ${validationErrors}`);
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // Cleanup
        console.log('\nCleaning up...');
        if (producer) {
            try {
                await producer.close();
            } catch (error) {
                console.error('Error closing producer:', error);
            }
        }
        if (consumer) {
            try {
                await consumer.close();
            } catch (error) {
                console.error('Error closing consumer:', error);
            }
        }
    }
}

runValidationTests().catch(console.error);
