import { Dataset, KeyValueStore } from 'crawlee';

export const handleMercadoLivreSearch = async ({ page, request, log }) => {
    const { platform, term, maxItems } = request.userData;
    log.info(`Scraping ${platform} for "${term}"`);

    // Aguardar por qualquer link de produto ou título H2 (super resiliente a mudanças de layout)
    try {
        await page.waitForSelector('a[href*="MLB"], h2', { timeout: 30000 });
    } catch (e) {
        log.warning(`No items found or captcha blocked for ${term} on ${platform}. Saving screenshot for debugging.`);
        const screenshot = await page.screenshot();
        await KeyValueStore.setValue(`error-ml-${term.replace(/[^a-z0-9]/gi, '_')}.png`, screenshot, { contentType: 'image/png' });
        const html = await page.content();
        await KeyValueStore.setValue(`error-ml-${term.replace(/[^a-z0-9]/gi, '_')}.html`, html, { contentType: 'text/html' });
        return;
    }

    const products = await page.$$eval('li.ui-search-layout__item, .poly-card, .andes-card, div.ui-search-result__wrapper', (els, max) => {
        // Remove duplicatas se um card estiver dentro do outro
        const uniqueEls = els.filter(el => !els.some(other => other !== el && other.contains(el)));

        return uniqueEls.slice(0, max).map(el => {
            const nameEl = el.querySelector('h2');
            const name = nameEl ? nameEl.innerText : el.innerText.split('\n')[0];

            let price = null;
            const priceFraction = el.querySelector('.andes-money-amount__fraction')?.innerText;
            const priceCents = el.querySelector('.andes-money-amount__cents')?.innerText || '00';
            
            if (priceFraction) {
                price = parseFloat(`${priceFraction.replace(/\./g, '')}.${priceCents}`);
            } else {
                // Fallback robusto buscando "R$" no texto do card
                const match = el.innerText.match(/R\$\s*([\d.]+)(?:,(\d{2}))?/);
                if (match) {
                    price = parseFloat(`${match[1].replace(/\./g, '')}.${match[2] || '00'}`);
                }
            }

            const currency = 'R$';
            const urlEl = el.querySelector('a');
            const url = urlEl ? urlEl.href : null;
            const imgEl = el.querySelector('img');
            const image = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-fallback')) : null;
            
            // Tentativa genérica de pegar a nota e reviews
            const ratingStr = el.querySelector('.ui-search-reviews__rating-number, .poly-reviews__rating')?.innerText;
            const reviewsStr = el.querySelector('.ui-search-reviews__amount, .poly-reviews__total')?.innerText;

            return {
                name,
                price,
                currency,
                url,
                image,
                rating: ratingStr ? parseFloat(ratingStr.replace(',', '.')) : null,
                reviews: reviewsStr ? parseInt(reviewsStr.replace(/\D/g, ''), 10) : null
            };
        });
    }, maxItems);

    const validProducts = products.filter(p => p.name && p.price);
    
    if (validProducts.length === 0) {
        log.warning(`Parsed 0 items on Mercado Livre for ${term}. Might be layout issue. Saving screenshot.`);
        const screenshot = await page.screenshot();
        await KeyValueStore.setValue(`error-ml-0-items-${term.replace(/[^a-z0-9]/gi, '_')}.png`, screenshot, { contentType: 'image/png' });
        const html = await page.content();
        await KeyValueStore.setValue(`error-ml-0-items-${term.replace(/[^a-z0-9]/gi, '_')}.html`, html, { contentType: 'text/html' });
    }

    const data = validProducts.map(p => ({ ...p, platform, search_term: term }));
    
    await Dataset.pushData(data);
    log.info(`Extracted ${data.length} items from ${platform}`);
};
