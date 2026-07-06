import { Actor } from 'apify';
import { PlaywrightCrawler, Dataset } from 'crawlee';
import { router } from './routes.js';

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init()
await Actor.init();

// Get the input of the actor
const input = await Actor.getInput();

if (!input || !input.searchTerms || !input.platforms) {
    throw new Error('Input is missing searchTerms or platforms.');
}

const { searchTerms, platforms, maxItems = 20 } = input;

// Create an array of initial requests based on the platforms and search terms
const initialRequests = [];

for (const term of searchTerms) {
    const encodedTerm = encodeURIComponent(term);
    
    if (platforms.includes('mercadolivre')) {
        initialRequests.push({
            url: `https://lista.mercadolivre.com.br/${encodedTerm}`,
            userData: { platform: 'Mercado Livre', term, maxItems },
            label: 'MERCADOLIVRE_SEARCH'
        });
    }
    
    if (platforms.includes('amazon')) {
        initialRequests.push({
            url: `https://www.amazon.com.br/s?k=${encodedTerm}`,
            userData: { platform: 'Amazon', term, maxItems },
            label: 'AMAZON_SEARCH'
        });
    }

    if (platforms.includes('shopee')) {
        initialRequests.push({
            url: `https://shopee.com.br/search?keyword=${encodedTerm}`,
            userData: { platform: 'Shopee', term, maxItems },
            label: 'SHOPEE_SEARCH'
        });
    }

    if (platforms.includes('aliexpress')) {
        initialRequests.push({
            url: `https://pt.aliexpress.com/w/wholesale-${encodedTerm}.html`,
            userData: { platform: 'AliExpress', term, maxItems },
            label: 'ALIEXPRESS_SEARCH'
        });
    }

    if (platforms.includes('ebay')) {
        initialRequests.push({
            url: `https://www.ebay.com/sch/i.html?_nkw=${encodedTerm}`,
            userData: { platform: 'eBay', term, maxItems },
            label: 'EBAY_SEARCH'
        });
    }

    if (platforms.includes('walmart')) {
        initialRequests.push({
            url: `https://www.walmart.com/search?q=${encodedTerm}`,
            userData: { platform: 'Walmart', term, maxItems },
            label: 'WALMART_SEARCH'
        });
    }
}

// Create a PlaywrightCrawler
const crawler = new PlaywrightCrawler({
    requestHandler: router,
    maxRequestsPerCrawl: 50, // Increase as needed
    // Playwright Crawler options
    headless: true,
});

// Run the crawler with the initial requests
await crawler.run(initialRequests);

// Exit successfully
await Actor.exit();
