import { Dataset, KeyValueStore } from 'crawlee';

export const handleAmazonSearch = async ({ page, request, log }) => {
    const { platform, term, maxItems } = request.userData;
    log.info(`Scraping ${platform} for "${term}"`);

    try {
        await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 30000 });
    } catch (e) {
        log.warning(`Timeout on Amazon for ${term}. Saving screenshot.`);
        const screenshot = await page.screenshot();
        await KeyValueStore.setValue(`error-amazon-${term.replace(/[^a-z0-9]/gi, '_')}.png`, screenshot, { contentType: 'image/png' });
        return;
    }

    const products = await page.$$eval('[data-component-type="s-search-result"]', (els, max) => {
        return els.slice(0, max).map(el => {
            const nameEl = el.querySelector('h2 a span');
            const name = nameEl ? nameEl.innerText : el.innerText.split('\\n')[0];
            
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
    
    if (validProducts.length === 0) {
        log.warning(`Parsed 0 items on Amazon for ${term}. Might be layout issue. Saving screenshot.`);
        const screenshot = await page.screenshot();
        await KeyValueStore.setValue(`error-amazon-0-items-${term.replace(/[^a-z0-9]/gi, '_')}.png`, screenshot, { contentType: 'image/png' });
        const html = await page.content();
        await KeyValueStore.setValue(`error-amazon-0-items-${term.replace(/[^a-z0-9]/gi, '_')}.html`, html, { contentType: 'text/html' });
    }

    const data = validProducts.map(p => ({ ...p, platform, search_term: term }));
    
    await Dataset.pushData(data);
    log.info(`Extracted ${data.length} items from ${platform}`);
};
