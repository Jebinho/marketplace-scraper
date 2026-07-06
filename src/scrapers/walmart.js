import { Dataset } from 'crawlee';

export const handleWalmartSearch = async ({ page, request, log }) => {
    const { platform, term, maxItems } = request.userData;
    log.info(`Scraping ${platform} for "${term}"`);

    try {
        await page.waitForSelector('[data-testid="item-stack"] > div', { timeout: 10000 });
    } catch (e) {
        log.warning(`No items found or captcha blocked for ${term} on ${platform}`);
        return;
    }

    const products = await page.$$eval('[data-testid="item-stack"] > div', (els, max) => {
        return els.slice(0, max).map(el => {
            const nameEl = el.querySelector('[data-automation-id="product-title"]');
            const name = nameEl ? nameEl.innerText : null;
            
            const priceEl = el.querySelector('[data-automation-id="product-price"]');
            const priceStr = priceEl ? priceEl.innerText : null;
            // Walmart price string can be complex, like "$14.99"
            let price = null;
            let currency = '$';
            if (priceStr) {
                const match = priceStr.match(/[\d,.]+/);
                if (match) {
                    price = parseFloat(match[0].replace(',', ''));
                }
            }

            const urlEl = el.querySelector('a');
            const url = urlEl ? urlEl.href : null;
            
            const imgEl = el.querySelector('img[data-testid="productTileImage"]');
            const image = imgEl ? imgEl.src : null;
            
            // Walmart usually has rating as a span text
            const ratingEl = el.querySelector('[data-testid="product-ratings"]');
            const ratingStr = ratingEl ? ratingEl.innerText : null;
            let rating = null;
            let reviews = null;
            
            // Very simplistic extraction for Walmart
            if (ratingStr) {
                // something like "4.5 out of 5 stars. 123 reviews"
                const numbers = ratingStr.match(/[\d.]+/g);
                if (numbers && numbers.length >= 2) {
                    rating = parseFloat(numbers[0]);
                    reviews = parseInt(numbers[numbers.length - 1], 10);
                }
            }

            return {
                name,
                price,
                currency,
                url,
                image,
                rating,
                reviews
            };
        });
    }, maxItems);

    const validProducts = products.filter(p => p.name);
    const data = validProducts.map(p => ({ ...p, platform, search_term: term }));
    
    await Dataset.pushData(data);
    log.info(`Extracted ${data.length} items from ${platform}`);
};
