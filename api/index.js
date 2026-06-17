import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("❌ FATAL: JWT_SECRET is not set in environment!");
    process.exit(1);
}

app.use(cors({
    origin: function(origin, callback) { callback(null, true); },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
}));
app.options('*', cors()); // handle preflight for all routes
app.use(express.json());

// ── Request Logging Middleware ────────────────────────────────────────────
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? '⚠️' : '✅';
        console.log(`${level} [${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// ── Auth Middleware ────────────────────────────────────────────────
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

// ── User Registration ──────────────────────────────────────────────
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

// ── User Login ─────────────────────────────────────────────────────
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
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const designs = await prisma.design.findMany({
            skip,
            take: limit,
            include: { user: { select: { name: true, affiliateCode: true } } },
            orderBy: { createdAt: 'desc' }
        });
        const total = await prisma.design.count();
        
        res.json({ 
            success: true, 
            designs,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching designs:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب التصميمات' });
    }
});

// ── Google Apps Script URL ─────────────────────────────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz5TDMGWf45Uq_veLsvF_4saG27Z1og--XqKkH6I5Q3dG4l2sFIPnJty-d3MGsBDX34/exec';

// ── proxy الطلب لـ Google Apps Script ─────────────────────────────
app.post('/api/submit-order', async (req, res) => {
    try {
        const orderData = req.body;
        
        // Input validation
        if (!orderData.email || !orderData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }
        if (orderData.designId && !Number.isInteger(parseInt(orderData.designId))) {
            return res.status(400).json({ error: 'Invalid design ID' });
        }
        if (orderData.affiliateCode && typeof orderData.affiliateCode !== 'string') {
            return res.status(400).json({ error: 'Invalid affiliate code' });
        }
        
        console.log('📦 إرسال الطلب لـ Google Apps Script:', orderData);

        // Handle Affiliate system or Design Purchase
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
                            discountBalance: { increment: 50 }
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

async function resolvePinItUrl(shortUrl) {
    // Resolve short pin.it links to full pinterest.com URL
    try {
        const response = await axios.get(shortUrl, {
            maxRedirects: 10,
            timeout: 8000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            },
            validateStatus: () => true, // accept all status codes
        });
        // After redirects, we have the final URL
        return response.request?.res?.responseUrl || response.config?.url || shortUrl;
    } catch {
        return shortUrl;
    }
}

async function getPinterestImageUrl(pinUrl) {
    try {
        // Strategy 1: Pinterest oEmbed API (official, no scraping needed)
        try {
            const oembedUrl = `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(pinUrl)}`;
            const oembedRes = await axios.get(oembedUrl, {
                timeout: 8000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; facebookexternalhit/1.1)',
                    'Accept': 'application/json',
                }
            });
            if (oembedRes.data?.thumbnail_url) {
                console.log('[Pinterest] oEmbed success:', oembedRes.data.thumbnail_url);
                return oembedRes.data.thumbnail_url;
            }
        } catch (e) {
            console.log('[Pinterest] oEmbed failed, trying scrape:', e.message);
        }

        // Strategy 2: Scrape with multiple User-Agents
        const agents = [
            'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Twitterbot/1.0',
            'LinkedInBot/1.0 (compatible; Mozilla/5.0; Jakarta Commons-HttpClient/3.1 +http://www.linkedin.com)',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        ];

        for (const agent of agents) {
            try {
                const response = await axios.get(pinUrl, {
                    maxRedirects: 10,
                    timeout: 10000,
                    headers: {
                        'User-Agent': agent,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Cache-Control': 'no-cache',
                    }
                });

                const html = response.data;
                if (typeof html !== 'string' || html.length < 100) continue;

                const $ = cheerio.load(html);

                let imageUrl =
                    $('meta[property="og:image:secure_url"]').attr('content') ||
                    $('meta[property="og:image"]').attr('content') ||
                    $('meta[name="twitter:image:src"]').attr('content') ||
                    $('meta[name="twitter:image"]').attr('content');

                // Try pinimg.com from JSON data
                if (!imageUrl) {
                    const pinImgMatch = html.match(/https:\/\/i\.pinimg\.com\/[^\s"'\\]+\.(?:jpg|jpeg|png|webp)/i);
                    if (pinImgMatch) imageUrl = pinImgMatch[0];
                }

                if (!imageUrl) {
                    const scripts = $('script[type="application/json"]').toArray();
                    for (const script of scripts) {
                        try {
                            const str = $(script).html() || '';
                            const match = str.match(/"url":"(https:\/\/i\.pinimg\.com\/[^"]+)"/);
                            if (match) { imageUrl = match[1]; break; }
                        } catch { /* ignore */ }
                    }
                }

                if (imageUrl) {
                    console.log(`[Pinterest] Scraped with agent ${agent.slice(0, 30)}: ${imageUrl}`);
                    return imageUrl;
                }
            } catch (e) {
                console.log(`[Pinterest] Agent failed: ${e.message}`);
            }
        }

        throw new Error('Could not extract image from Pinterest URL after all strategies.');
    } catch (error) {
        console.error('Error extracting Pinterest image:', error.message);
        throw error;
    }
}

app.post('/api/pinterest-image', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: 'يرجى إدخال رابط صحيح.' });
    }

    try {
        // If it's a short link (pin.it), resolve it first
        let resolvedUrl = url;
        if (url.includes('pin.it')) {
            resolvedUrl = await resolvePinItUrl(url);
            console.log('[Pinterest] Resolved pin.it →', resolvedUrl);
        }

        const imageUrl = await getPinterestImageUrl(resolvedUrl);
        res.json({ success: true, imageUrl });
    } catch (error) {
        console.error('[Pinterest] Final error:', error.message);
        res.status(500).json({ success: false, error: 'تعذّر استخراج الصورة من الرابط. جرّب نسخ رابط الصورة مباشرة من المتصفح.' });
    }
});


app.get('/api/proxy-image', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('No url provided');
    
    try {
        // SSRF Protection: Block private/internal IPs
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname;
        
        // Block localhost and private IPs
        if (hostname === 'localhost' || 
            hostname === '127.0.0.1' || 
            hostname === '0.0.0.0' ||
            !hostname.includes('.') ||
            hostname.match(/^192\.168\.|^10\.|^172\.1[6-9]\.|^172\.2[0-9]\.|^172\.3[01]\.|^169\.254\./)) {
            return res.status(403).json({ error: 'Access denied. Private IPs not allowed.' });
        }

        const response = await axios.get(url, { responseType: 'stream', timeout: 5000 });
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
        response.data.pipe(res);
    } catch (error) {
        res.status(500).send('Error proxying image');
    }
});

// ── Admin Routes ───────────────────────────────────────────────────

// Security Audit Logger
const logSecurityEvent = async (event, req, details = {}) => {
    try {
        await prisma.securityLog.create({
            data: {
                event,
                userId: req.user?.id,
                userEmail: req.user?.email,
                details: JSON.stringify(details),
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            }
        });
    } catch (e) {
        console.error("Audit log failed", e);
    }
};

app.get('/api/admin/users', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const users = await prisma.user.findMany({
            skip,
            take: limit,
            select: { id: true, name: true, email: true, discountBalance: true, referredUsers: true, isAdmin: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        const total = await prisma.user.count();

        // Log admin action
        await logSecurityEvent('admin_fetch_users', req, { page, limit, total });
        
        res.json({ 
            success: true, 
            users,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.delete('/api/admin/designs/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const designId = parseInt(req.params.id);
        const design = await prisma.design.findUnique({ where: { id: designId } });
        if (!design) return res.status(404).json({ error: 'Design not found' });
        
        await prisma.design.delete({ where: { id: designId } });
        
        // Log admin action
        await logSecurityEvent('admin_delete_design', req, { designId, designName: design.name });
        
        res.json({ success: true, message: 'تم مسح التصميم بنجاح' });
    } catch (error) {
        res.status(500).json({ error: 'فشل مسح التصميم' });
    }
});

app.delete('/api/admin/users/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Prevent deleting self
        if (user.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
        
        // Delete designs first to avoid foreign key constraints
        await prisma.design.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
        
        // Log admin action
        await logSecurityEvent('admin_delete_user', req, { userId, userEmail: user.email });
        
        res.json({ success: true, message: 'تم مسح المستخدم بنجاح' });
    } catch (error) {
        res.status(500).json({ error: 'فشل مسح المستخدم' });
    }
});

// ── API Documentation ─────────────────────────────────────────────
app.get('/api-docs', (req, res) => {
    const docs = {
        title: 'PrintStudio API Documentation',
        version: '1.0.0',
        endpoints: {
            auth: [
                { method: 'POST', path: '/api/auth/register', description: 'Register new user' },
                { method: 'POST', path: '/api/auth/login', description: 'Login user' },
                { method: 'GET', path: '/api/auth/me', auth: 'required', description: 'Get user profile' }
            ],
            designs: [
                { method: 'GET', path: '/api/designs?page=1&limit=20', description: 'Get all designs' },
                { method: 'POST', path: '/api/designs', auth: 'required', description: 'Create design' }
            ],
            admin: [
                { method: 'GET', path: '/api/admin/users?page=1&limit=20', auth: 'admin', description: 'List users' },
                { method: 'DELETE', path: '/api/admin/users/:id', auth: 'admin', description: 'Delete user' },
                { method: 'DELETE', path: '/api/admin/designs/:id', auth: 'admin', description: 'Delete design' }
            ]
        },
        security: 'JWT token required for protected endpoints'
    };
    res.json(docs);
});

// ── Health Check Endpoint ─────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
    try {
        // Check database connection
        await prisma.user.findFirst({ take: 1 });
        res.status(200).json({ 
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: 'Database connection failed'
        });
    }
});

// Removed unsafe make-andro-admin endpoint: use authenticated admin API instead.

export default app;

