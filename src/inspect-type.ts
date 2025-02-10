import { QuoteResponse } from '@7kprotocol/sdk-ts';

// Log the structure of QuoteResponse
const dummyQuoteResponse: QuoteResponse = {} as QuoteResponse;
console.log('QuoteResponse required properties:', Object.keys(dummyQuoteResponse));

// Try to access some properties to see TypeScript errors
console.log(dummyQuoteResponse.effectivePrice);
console.log(dummyQuoteResponse.effectivePriceReserved);
console.log(dummyQuoteResponse.priceImpact);
console.log(dummyQuoteResponse.swapAmount);
