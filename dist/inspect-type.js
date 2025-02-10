"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Log the structure of QuoteResponse
const dummyQuoteResponse = {};
console.log('QuoteResponse required properties:', Object.keys(dummyQuoteResponse));
// Try to access some properties to see TypeScript errors
console.log(dummyQuoteResponse.effectivePrice);
console.log(dummyQuoteResponse.effectivePriceReserved);
console.log(dummyQuoteResponse.priceImpact);
console.log(dummyQuoteResponse.swapAmount);
