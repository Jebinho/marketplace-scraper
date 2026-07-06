import { Dataset } from 'crawlee';

export const handleEbaySearch = async ({ page, request, log }) => {
    const { platform, term, maxItems } = request.userData;
    log.info(`Scraping ${platform} for "${term}"`);

    try {
        await page.waitForSelector('.s-item', { timeout: 10000 });
    } catch (e) {
        log.warning(`No items found for ${term} on ${platform}`);
        return;
    }

    const products = await page.$$eval('.s-item', (els, max) => {
        // eBay usually has a dummy first item, so we might skip it if it has no title
        return els.map(el => {
            const name = el.querySelector('.s-item__title')?.innerText;
            if (!name || name.includes('Shop on eBay')) return null;

            const priceStr = el.querySelector('.s-item__price')?.innerText;
            const price = priceStr ? parseFloat(priceStr.replace(/[^0-9.]/g, '')) : null;
            const currency = priceStr ? priceStr.replace(/[0-9.,\s]/g, '') : '$';
            
            const url = el.querySelector('.s-item__link')?.href;
            const imgEl = el.querySelector('.s-item__image-img');
            const image = imgEl ? imgEl.src : null;
            
            const reviewsStr = el.querySelector('.s-item__reviews-count span')?.innerText;
            const reviews = reviewsStr ? parseInt(reviewsStr.replace(/[^0-9]/g, ''), 10) : null;
            
            // eBay search results usually don't show star rating easily, but we try
            const ratingStr = el.querySelector('.star-rating')?.getAttribute('aria-label');
            const rating = ratingStr ? parseFloat(ratingStr.replace(/[^0-9.]/g, '')) : null;

            return {
                name,
                price,
                currency,
                url,
                image,
                rating,
                reviews
            };
        }).filter(p => p !== null).slice(0, max);
    }, maxItems);

    const data = products.map(p => ({ ...p, platform, search_term: term }));
    await Dataset.pushData(data);
    log.info(`Extracted ${data.length} items from ${platform}`);
};
