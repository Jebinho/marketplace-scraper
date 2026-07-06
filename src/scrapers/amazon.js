import { Dataset } from 'crawlee';

export const handleAmazonSearch = async ({ page, request, log }) => {
    const { platform, term, maxItems } = request.userData;
    log.info(`Scraping ${platform} for "${term}"`);

    try {
        // Amazon typically uses these selectors for search results
        await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 10000 });
    } catch (e) {
        log.warning(`No items found or captcha blocked for ${term} on ${platform}`);
        return;
    }

    const products = await page.$$eval('[data-component-type="s-search-result"]', (els, max) => {
        return els.slice(0, max).map(el => {
            const nameEl = el.querySelector('h2 a span');
            const name = nameEl ? nameEl.innerText : null;
            
            const priceWhole = el.querySelector('.a-price-whole')?.innerText;
            const priceFraction = el.querySelector('.a-price-fraction')?.innerText;
            const price = priceWhole ? parseFloat(`${priceWhole.replace(/[^0-9]/g, '')}.${priceFraction || '00'}`) : null;
            
            const currency = el.querySelector('.a-price-symbol')?.innerText || 'R$';
            
            const urlEl = el.querySelector('h2 a');
            const url = urlEl ? urlEl.href : null;
            
            const imgEl = el.querySelector('img.s-image');
            const image = imgEl ? imgEl.src : null;
            
            const ratingEl = el.querySelector('.a-icon-alt');
            const ratingStr = ratingEl ? ratingEl.innerText.split(' ')[0] : null;
            const rating = ratingStr ? parseFloat(ratingStr.replace(',', '.')) : null;
            
            const reviewsEl = el.querySelector('[aria-label$="avaliações"], [aria-label$="ratings"]');
            const reviewsStr = reviewsEl ? reviewsEl.getAttribute('aria-label') : null;
            const reviews = reviewsStr ? parseInt(reviewsStr.replace(/[^0-9]/g, ''), 10) : null;

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
