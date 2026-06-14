import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// User Registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'البريد الإلكتروني مسجل بالفعل' });

        const hashedPassword = await bcrypt.hash(password, 10);
        // Generate a random affiliate code
        const affiliateCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, affiliateCode }
        });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, affiliateCode: user.affiliateCode, discountBalance: user.discountBalance, referredUsers: user.referredUsers } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'حدث خطأ أثناء التسجيل' });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'كلمة المرور غير صحيحة' });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, affiliateCode: user.affiliateCode, discountBalance: user.discountBalance, referredUsers: user.referredUsers } });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
    }
});

// ── Get User Profile ───────────────────────────────────────────────
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.sendStatus(404);
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, affiliateCode: user.affiliateCode, discountBalance: user.discountBalance, referredUsers: user.referredUsers } });
    } catch (error) {
        res.sendStatus(500);
    }
});

// ── Community Designs ──────────────────────────────────────────────
app.post('/api/designs', authenticateToken, async (req, res) => {
    try {
        const { name, frontDesign, backDesign, tshirtColor, imageUrl } = req.body;
        const design = await prisma.design.create({
            data: {
                userId: req.user.id,
                name,
                frontDesign: JSON.stringify(frontDesign),
                backDesign: JSON.stringify(backDesign),
                tshirtColor,
                imageUrl
            }
        });
        res.json({ success: true, design });
    } catch (error) {
        console.error('Error creating design:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء نشر التصميم' });
    }
});

app.get('/api/designs', async (req, res) => {
    try {
        const designs = await prisma.design.findMany({
            include: { user: { select: { name: true, affiliateCode: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, designs });
    } catch (error) {
        console.error('Error fetching designs:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب التصميمات' });
    }
});


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

        // We will NOT force 'originals' because some pins don't have it and return 403.
        // The default og:image is usually 736x which is perfectly high res.
        // imageUrl = imageUrl.replace(/236x|474x|736x/g, 'originals');

        return imageUrl;
    } catch (error) {
        console.error('Error extracting Pinterest image:', error.message);
        throw error;
    }
}

// ── Google Apps Script proxy — يتجنب CORS تماماً ─────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz5TDMGWf45Uq_veLsvF_4saG27Z1og--XqKkH6I5Q3dG4l2sFIPnJty-d3MGsBDX34/exec';

app.post('/api/submit-order', async (req, res) => {
    try {
        const orderData = req.body;
        console.log('📦 إرسال الطلب لـ Google Apps Script:', orderData);

        // Handle Affiliate system
        if (orderData.affiliateCode) {
            try {
                const affiliate = await prisma.user.findUnique({ where: { affiliateCode: orderData.affiliateCode } });
                if (affiliate) {
                    await prisma.user.update({
                        where: { id: affiliate.id },
                        data: { 
                            discountBalance: { increment: 50 },
                            referredUsers: { increment: 1 }
                        }
                    });
                    console.log(`✅ تمت إضافة 50 جنيه لحساب الكود ${orderData.affiliateCode}`);
                }
            } catch (err) {
                console.error("Error processing affiliate code", err);
            }
        }
        
        // Handle Design Creator Reward
        if (orderData.designId) {
            try {
                const design = await prisma.design.findUnique({ where: { id: parseInt(orderData.designId) }, include: { user: true } });
                if (design) {
                    await prisma.user.update({
                        where: { id: design.userId },
                        data: {
                            discountBalance: { increment: 50 },
                            referredUsers: { increment: 1 }
                        }
                    });
                    await prisma.design.update({
                        where: { id: design.id },
                        data: { purchases: { increment: 1 } }
                    });
                    console.log(`✅ تمت إضافة 50 جنيه لمنشئ التصميم (ID: ${design.userId})`);
                }
            } catch (err) {
                console.error("Error processing design reward", err);
            }
        }

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

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve the React app for any other request (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
