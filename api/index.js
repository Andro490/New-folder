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
        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('❌ خطأ Google Script:', error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

async function getPinterestImageUrl(pinUrl) {
    try {
        const response = await axios.get(pinUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        let imageUrl = $('meta[property="og:image"]').attr('content');

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

