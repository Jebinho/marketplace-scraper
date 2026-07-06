import { Dataset } from 'crawlee';

export const handleMercadoLivreSearch = async ({ page, request, log }) => {
    const { platform, term, maxItems } = request.userData;
    log.info(`Scraping ${platform} for "${term}"`);

    try {
        await page.waitForSelector('.ui-search-layout__item', { timeout: 10000 });
    } catch (e) {
        log.warning(`No items found for ${term} on ${platform}`);
        return;
    }

    const products = await page.$$eval('.ui-search-layout__item', (els, max) => {
        return els.slice(0, max).map(el => {
            const nameEl = el.querySelector('h2');
            const name = nameEl ? nameEl.innerText : null;
            const priceFraction = el.querySelector('.andes-money-amount__fraction')?.innerText;
            const priceCents = el.querySelector('.andes-money-amount__cents')?.innerText || '00';
            const price = priceFraction ? parseFloat(`${priceFraction.replace(/\./g, '')}.${priceCents}`) : null;
            const currency = el.querySelector('.andes-money-amount__currency-symbol')?.innerText || 'R$';
            const urlEl = el.querySelector('a');
            const url = urlEl ? urlEl.href : null;
            const imgEl = el.querySelector('img');
            const image = imgEl ? (imgEl.src || imgEl.getAttribute('data-src')) : null;
            const ratingStr = el.querySelector('.ui-search-reviews__rating-number')?.innerText;
            const reviewsStr = el.querySelector('.ui-search-reviews__amount')?.innerText;

            return {
                name,
                price,
                currency,
                url,
                image,
                rating: ratingStr ? parseFloat(ratingStr) : null,
                reviews: reviewsStr ? parseInt(reviewsStr.replace(/[^0-9]/g, ''), 10) : null,
            };
        });
    }, maxItems);

    const data = products.map(p => ({ ...p, platform, search_term: term }));
    await Dataset.pushData(data);
    log.info(`Extracted ${data.length} items from ${platform}`);
};
