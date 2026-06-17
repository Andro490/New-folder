import axios from 'axios';
import * as cheerio from 'cheerio';

async function getPinterestImageUrl(pinUrl) {
    try {
        const response = await axios.get(pinUrl, {
            maxRedirects: 10,
            timeout: 12000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        let imageUrl =
            $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image:src"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') ||
            $('meta[property="og:image:secure_url"]').attr('content');

        if (!imageUrl) {
            const scripts = $('script[type="application/json"]').toArray();
            for (const script of scripts) {
                try {
                    const json = JSON.parse($(script).html() || '');
                    const str = JSON.stringify(json);
                    const match = str.match(/"url":"(https:\/\/i\.pinimg\.com\/[^"]+)"/);
                    if (match) { imageUrl = match[1]; break; }
                } catch { /* ignore */ }
            }
        }

        if (!imageUrl) {
            throw new Error('Image not found in the page meta tags.');
        }

        return imageUrl;
    } catch (error) {
        console.error('Error extracting Pinterest image:', error.message);
        throw error;
    }
}

getPinterestImageUrl('https://pin.it/75N7erUnx').then(console.log).catch(console.error);
