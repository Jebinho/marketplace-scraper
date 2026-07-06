import { createPlaywrightRouter, Dataset } from 'crawlee';
import { handleMercadoLivreSearch } from './scrapers/mercadolivre.js';
import { handleAmazonSearch } from './scrapers/amazon.js';
import { handleShopeeSearch } from './scrapers/shopee.js';
import { handleAliExpressSearch } from './scrapers/aliexpress.js';
import { handleEbaySearch } from './scrapers/ebay.js';
import { handleWalmartSearch } from './scrapers/walmart.js';

export const router = createPlaywrightRouter();

router.addHandler('MERCADOLIVRE_SEARCH', handleMercadoLivreSearch);
router.addHandler('AMAZON_SEARCH', handleAmazonSearch);
router.addHandler('SHOPEE_SEARCH', handleShopeeSearch);
router.addHandler('ALIEXPRESS_SEARCH', handleAliExpressSearch);
router.addHandler('EBAY_SEARCH', handleEbaySearch);
router.addHandler('WALMART_SEARCH', handleWalmartSearch);

// Handler genérico caso caia numa rota sem label ou não definida
router.addDefaultHandler(async ({ request, log }) => {
    log.info(`Unhandled request: ${request.url}`);
});
