import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();

app.use(cors());
app.use(express.json());

// ── Google Apps Script URL ─────────────────────────────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz5TDMGWf45Uq_veLsvF_4saG27Z1og--XqKkH6I5Q3dG4l2sFIPnJty-d3MGsBDX34/exec';

// ── proxy الطلب لـ Google Apps Script ─────────────────────────────
app.post('/api/submit-order', async (req, res) => {
    try {
        const orderData = req.body;
        console.log('📦 إرسال الطلب لـ Google Apps Script:', orderData);

        const response = await axios.post(APPS_SCRIPT_URL, orderData, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
        });

        console.log('✅ استجابة Google Script:', response.data);
        if (response.data && response.data.status === 'error') {
            return res.status(500).json({ success: false, error: response.data.message });
        }
        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('❌ خطأ Google Script:', error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

async function getPinterestImageUrl(pinUrl) {
    try {
        const response = await axios.get(pinUrl, {
            maxRedirects: 10,         // follow pin.it → pinterest.com redirects
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

        // Try multiple selectors in order of reliability
        let imageUrl =
            $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image:src"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') ||
            $('meta[property="og:image:secure_url"]').attr('content');

        if (!imageUrl) {
            // Try to extract from JSON-LD or script tags
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


app.post('/api/pinterest-image', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Please provide a valid URL.' });
    }

    try {
        const imageUrl = await getPinterestImageUrl(url);
        res.json({ success: true, imageUrl });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch image from Pinterest URL.' });
    }
});

app.get('/api/proxy-image', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('No url provided');
    
    try {
        const response = await axios.get(url, { responseType: 'stream' });
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
        response.data.pipe(res);
    } catch (error) {
        res.status(500).send('Error proxying image');
    }
});

export default app;

