import { Dataset } from 'crawlee';

export const handleAliExpressSearch = async ({ page, request, log }) => {
    const { platform, term, maxItems } = request.userData;
    log.info(`Scraping ${platform} for "${term}"`);

    try {
        // AliExpress uses dynamic classes, but often has search-card or similar
        await page.waitForSelector('a[href*="/item/"], [class*="search-card"], [class*="search-item"]', { timeout: 15000 });
    } catch (e) {
        log.warning(`No items found or captcha blocked for ${term} on ${platform}`);
        return;
    }

    // Scroll a bit to lazy load images
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(2000);

    const products = await page.$$eval('a[href*="/item/"]', (els, max) => {
        // Find closest wrapper for each link to get price and title if not inside the link
        return els.slice(0, max).map(el => {
            // Some versions of AliExpress put everything inside the <a> tag
            const nameEl = el.querySelector('h1, h3, [class*="title"]');
            const name = nameEl ? nameEl.innerText : el.innerText.split('\n')[0];
            
            const priceEl = el.querySelector('[class*="price-sale"], [class*="price"]');
            const priceStr = priceEl ? priceEl.innerText : null;
            let price = null;
            let currency = 'R$';
            
            if (priceStr) {
                const match = priceStr.match(/[\d,.]+/);
                if (match) {
                    price = parseFloat(match[0].replace(',', '.'));
                }
            }

            const url = el.href;
            
            const imgEl = el.querySelector('img');
            const image = imgEl ? imgEl.src : null;
            
            const ratingEl = el.querySelector('[class*="rating"], [class*="star"]');
            const ratingStr = ratingEl ? ratingEl.innerText : null;
            const rating = ratingStr ? parseFloat(ratingStr) : null;
            
            const reviewsEl = el.querySelector('[class*="evaluation"], [class*="trade"]');
            const reviewsStr = reviewsEl ? reviewsEl.innerText : null;
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

    const validProducts = products.filter(p => p.name && p.price);
    const data = validProducts.map(p => ({ ...p, platform, search_term: term }));
    
    await Dataset.pushData(data);
    log.info(`Extracted ${data.length} items from ${platform}`);
};
