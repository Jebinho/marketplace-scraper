import { Dataset, KeyValueStore } from 'crawlee';

export const handleMercadoLivreSearch = async ({ page, request, log }) => {
    const { platform, term, maxItems } = request.userData;
    log.info(`Scraping ${platform} for "${term}"`);

    // Aguardar o carregamento da página com um limite de tempo maior (proxies são lentos)
    try {
        await page.waitForSelector('.ui-search-layout__item, .poly-card', { timeout: 30000 });
    } catch (e) {
        log.warning(`No items found or captcha blocked for ${term} on ${platform}. Saving screenshot for debugging.`);
        const screenshot = await page.screenshot();
        await KeyValueStore.setValue(`error-ml-${term.replace(/[^a-z0-9]/gi, '_')}.png`, screenshot, { contentType: 'image/png' });
        const html = await page.content();
        await KeyValueStore.setValue(`error-ml-${term.replace(/[^a-z0-9]/gi, '_')}.html`, html, { contentType: 'text/html' });
        return;
    }

    const products = await page.$$eval('.ui-search-layout__item, .poly-card', (els, max) => {
        return els.slice(0, max).map(el => {
            const nameEl = el.querySelector('h2');
            const name = nameEl ? nameEl.innerText : el.innerText.split('\\n')[0];

            let price = null;
            const priceFraction = el.querySelector('.andes-money-amount__fraction')?.innerText;
            const priceCents = el.querySelector('.andes-money-amount__cents')?.innerText || '00';
            
            if (priceFraction) {
                price = parseFloat(`${priceFraction.replace(/\\./g, '')}.${priceCents}`);
            } else {
                // Fallback robusto buscando "R$" no texto do card
                const match = el.innerText.match(/R\\$\\s*([\\d.]+)(?:,(\\d{2}))?/);
                if (match) {
                    price = parseFloat(`${match[1].replace(/\\./g, '')}.${match[2] || '00'}`);
                }
            }

            const currency = 'R$';
            const urlEl = el.querySelector('a');
            const url = urlEl ? urlEl.href : null;
            const imgEl = el.querySelector('img');
            const image = imgEl ? (imgEl.src || imgEl.getAttribute('data-src')) : null;
            
            // Tentativa genérica de pegar a nota e reviews
            const ratingStr = el.querySelector('.ui-search-reviews__rating-number, .poly-reviews__rating')?.innerText;
            const reviewsStr = el.querySelector('.ui-search-reviews__amount, .poly-reviews__total')?.innerText;

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
