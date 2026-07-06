import { Dataset } from 'crawlee';

export const handleShopeeSearch = async ({ page, request, log }) => {
    const { platform, term, maxItems } = request.userData;
    log.info(`Scraping ${platform} for "${term}"`);

    try {
        await page.waitForSelector('[data-sqe="item"]', { timeout: 15000 });
    } catch (e) {
        log.warning(`No items found or captcha blocked for ${term} on ${platform}`);
        return;
    }

    // Scroll to lazy load
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(2000);

    const products = await page.$$eval('[data-sqe="item"]', (els, max) => {
        return els.slice(0, max).map(el => {
            // Shopee uses deeply nested divs
            const nameEl = el.querySelector('div[data-sqe="name"] > div');
            const name = nameEl ? nameEl.innerText : null;
            
            const priceEl = el.querySelector('div[data-sqe="name"]')?.parentElement?.querySelector('div > span:nth-child(2)');
            const priceStr = priceEl ? priceEl.innerText : null;
            let price = null;
            if (priceStr) {
                price = parseFloat(priceStr.replace(/\./g, '').replace(',', '.'));
            }

            const urlEl = el.querySelector('a');
            const url = urlEl ? urlEl.href : null;
            
            const imgEl = el.querySelector('img');
            const image = imgEl ? imgEl.src : null;
            
            // Shopee rating is usually a visual stars width or text
            const reviewsEl = el.querySelector('div[data-sqe="rating"]')?.nextElementSibling;
            const reviewsStr = reviewsEl ? reviewsEl.innerText : null;
            let reviews = null;
            if (reviewsStr) {
                // "1,2 mil vendidos" or "12 vendidos"
                const mult = reviewsStr.includes('mil') ? 1000 : 1;
                const match = reviewsStr.match(/[\d,]+/);
                if (match) {
                    reviews = parseFloat(match[0].replace(',', '.')) * mult;
                }
            }

            return {
                name,
                price,
                currency: 'R$',
                url,
                image,
                rating: null, // Hard to extract without complex logic on Shopee
                reviews
            };
        });
    }, maxItems);

    const validProducts = products.filter(p => p.name);
    const data = validProducts.map(p => ({ ...p, platform, search_term: term }));
    
    await Dataset.pushData(data);
    log.info(`Extracted ${data.length} items from ${platform}`);
};
