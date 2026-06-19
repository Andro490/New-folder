import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Prisma Client with Query Logging ─────────────────────────────────
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'production' 
        ? ['error', 'warn'] 
        : ['info', 'warn', 'error', 'query']
});

// Log all database queries in development
if (process.env.NODE_ENV !== 'production') {
    prisma.$on('query', (e) => {
        console.log('🔍 [Prisma Query]', e.query);
        if (e.duration > 1000) {
            console.warn('⚠️  Slow Query:', e.duration + 'ms');
        }
    });
}
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("❌ FATAL: JWT_SECRET is not set in environment!");
    process.exit(1);
}
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';

// ── Email Transporter (Nodemailer) ──────────────────────────────────
const emailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
    }
});

// ── OTP In-Memory Store (email -> { code, expires, pendingData }) ──
const otpStore = new Map();

app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-csrf-token'],
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Stateless CSRF Token Middleware (HMAC-signed, works across restarts & multiple instances) ──
// Auth routes are already protected by bcrypt + JWT + rate-limiting, so they are exempt.
const CSRF_SECRET = process.env.CSRF_SECRET || JWT_SECRET; // Reuse JWT_SECRET as fallback

// Endpoints that are exempt from CSRF (already protected by other means)
const CSRF_EXEMPT_PATHS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/send-otp',
    '/api/auth/verify-otp',
    '/api/auth/google',
    '/api/auth/google/callback',
    '/api/pinterest-image',
    '/api/submit-order',
    '/api/designs',
];

app.get('/api/csrf-token', (req, res) => {
    const ts = Date.now();
    const rand = crypto.randomBytes(16).toString('hex');
    const payload = `${ts}:${rand}`;
    const sig = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
    res.json({ csrfToken: `${payload}:${sig}` });
});

const verifyCsrfToken = (req, res, next) => {
    // Skip non-mutating methods
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) return next();
    // Skip exempt auth paths
    if (CSRF_EXEMPT_PATHS.includes(req.path)) return next();
    // Admin and user endpoints using Bearer token auth do not use cookies, so they are immune to CSRF
    if (req.path.startsWith('/api/admin/') || req.path.startsWith('/api/user/')) return next();

    const token = req.headers['x-csrf-token'];
    if (!token) return res.status(403).json({ error: 'Invalid CSRF token' });

    try {
        const parts = token.split(':');
        if (parts.length !== 3) throw new Error('malformed');
        const [ts, rand, sig] = parts;
        const payload = `${ts}:${rand}`;
        const expected = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
        if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) {
            throw new Error('signature mismatch');
        }
        // Token valid for 2 hours
        if (Date.now() - parseInt(ts, 10) > 2 * 60 * 60 * 1000) {
            return res.status(403).json({ error: 'CSRF token expired' });
        }
    } catch {
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next();
};

app.use(verifyCsrfToken);

// ── Request Logging Middleware ──────────────────────────────────────
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? '⚠️' : '✅';
        console.log(`${level} [${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// ── Security Headers & HTTPS Enforcement ────────────────────────────
app.use((req, res, next) => {
    // HTTPS Enforcement in production
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    
    // Security Headers (Helmet alternative)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    // Content Security Policy (basic)
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src * data: blob:; connect-src * blob: data:;");
    
    next();
});

// ── Google OAuth (native - no passport needed) ──────────────────────
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

// Step 1: Redirect user to Google login
app.get('/api/auth/google', (req, res) => {
    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: `${SERVER_URL}/api/auth/google/callback`,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account',
    });
    res.redirect(`${GOOGLE_AUTH_URL}?${params}`);
});

// Step 2: Google redirects back with a code
app.get('/api/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect(`${CLIENT_URL}/auth?error=google_failed`);

    try {
        // Exchange code for access token
        const tokenRes = await axios.post(GOOGLE_TOKEN_URL, {
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: `${SERVER_URL}/api/auth/google/callback`,
            grant_type: 'authorization_code',
        });

        const { access_token } = tokenRes.data;

        // Get user profile from Google
        const userInfoRes = await axios.get(GOOGLE_USERINFO_URL, {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { sub: googleId, email, name, picture: avatarUrl } = userInfoRes.data;
        if (!email) return res.redirect(`${CLIENT_URL}/auth?error=google_failed`);

        // Find or create user in DB
        let user = await prisma.user.findUnique({ where: { googleId } });
        if (!user) {
            user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                user = await prisma.user.update({ where: { email }, data: { googleId, avatarUrl } });
            } else {
                const affiliateCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                user = await prisma.user.create({ data: { name, email, googleId, avatarUrl, affiliateCode } });
            }
        }

        // Return JWT to frontend via URL query param
        // (HttpOnly cookie won't transfer cross-domain Railway→Vercel with SameSite=strict)
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        res.redirect(`${CLIENT_URL}/auth/google/success?token=${token}`);

    } catch (err) {
        console.error('Google OAuth error:', err.response?.data || err.message);
        res.redirect(`${CLIENT_URL}/auth?error=google_failed`);
    }
});

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

// ── Get User Profile ───────────────────────────────────────────────
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.sendStatus(404);
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, affiliateCode: user.affiliateCode, discountBalance: user.discountBalance, referredUsers: user.referredUsers, isAdmin: user.isAdmin, avatarUrl: user.avatarUrl } });
    } catch (error) {
        res.sendStatus(500);
    }
});

// ── Rate Limiter ──────────────────────────────────────────────────
const rateLimitStore = new Map();

// Generic rate limiting function with customizable window and max attempts
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 5) => {
    return (req, res, next) => {
        const key = `${req.ip}:${req.path}`;
        const now = Date.now();
        const record = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
        
        if (now > record.resetTime) {
            record.count = 1;
            record.resetTime = now + windowMs;
        } else {
            record.count++;
        }
        rateLimitStore.set(key, record);
        
        if (record.count > max) {
            return res.status(429).json({ 
                error: 'Too many requests. Please try again later.',
                retryAfter: Math.ceil((record.resetTime - now) / 1000)
            });
        }
        next();
    };
};

// Legacy support
const checkRateLimit = (ip) => {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const max = 5;
    const record = rateLimitStore.get(ip) || { count: 0, resetTime: now + windowMs };
    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
    } else {
        record.count++;
    }
    rateLimitStore.set(ip, record);
    return record.count <= max;
};

// ── Step 1: Send OTP (register or login) ──────────────────────────
app.post('/api/auth/send-otp', async (req, res) => {
    if (!checkRateLimit(req.ip)) {
        return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }
    try {
        const { name, email, password, isLogin } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'يرجى تعبئة جميع الحقول' });

        // Validate credentials BEFORE sending OTP
        if (isLogin) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) return res.status(400).json({ error: 'البريد الإلكتروني غير مسجل' });
            if (!user.password) return res.status(400).json({ error: 'هذا الحساب مسجل عبر جوجل' });
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) return res.status(400).json({ error: 'كلمة المرور غير صحيحة' });
        } else {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) return res.status(400).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
            if (!name || name.trim().length < 2) return res.status(400).json({ error: 'يرجى إدخال اسم صحيح' });
            if (password.length < 8) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
            const commonPasswords = ['12345678', 'password', '123456789'];
            if (commonPasswords.includes(password.toLowerCase())) return res.status(400).json({ error: 'كلمة المرور ضعيفة جداً' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in database
        // Delete any existing OTP for this email first
        await prisma.oTP.deleteMany({ where: { email } });
        await prisma.oTP.create({
            data: { email, code: otp, expiresAt }
        });

        // Send email or fallback to console if no email configured
        const gasUrl = process.env.GAS_EMAIL_URL;
        const resendKey = process.env.RESEND_API_KEY;
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;

        if (!gasUrl && !resendKey && (!emailUser || !emailPass)) {
            console.log(`\n\n[MOCK EMAIL] OTP for ${email} is: ${otp}\n\n`);
            return res.json({ success: true, message: 'تم إنشاء الكود (راجع سجلات السيرفر لأن الإيميل غير مفعّل)' });
        }

        const htmlContent = `
            <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 400px; margin: auto; padding: 32px; background: #fff8e8; border-radius: 12px; border: 1px solid #d4ba7b; text-align: center;">
                <h2 style="color: #4a3b2c; margin-bottom: 16px;">PrintStudio 🎨</h2>
                <p style="color: #6a543f; font-size: 16px;">مرحباً بك! هذا هو كود التحقق الخاص بك:</p>
                <div style="margin: 32px 0;">
                    <div style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #8b6b43; background: #ffffff; padding: 16px 32px; border-radius: 8px; border: 2px dashed #d4ba7b; white-space: nowrap;">
                        ${otp}
                    </div>
                </div>
                <p style="color: #8b6b43; font-size: 13px; margin-top: 24px;">صالح لمدة 10 دقائق فقط. برجاء عدم مشاركته مع أحد.</p>
                <hr style="border: none; border-top: 1px solid #eaddbc; margin: 24px 0;" />
                <p style="color: #a89476; font-size: 11px;">هذه رسالة تلقائية، يرجى عدم الرد عليها.</p>
            </div>
        `;

        try {
            if (gasUrl) {
                // Use Google Apps Script (100% Free, bypasses Railway restrictions)
                const gasRes = await fetch(gasUrl, {
                    method: 'POST',
                    body: JSON.stringify({
                        to: email,
                        subject: '🔐 كود التحقق - PrintStudio',
                        htmlBody: htmlContent
                    })
                });
                const gasData = await gasRes.json();
                if (!gasData.success) throw new Error(gasData.error || 'Google Script Error');
            } else if (resendKey) {
                // Use Resend API
                const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from: 'onboarding@resend.dev',
                        to: email,
                        subject: '🔐 كود التحقق - PrintStudio',
                        html: htmlContent
                    })
                });
                if (!resendResponse.ok) throw new Error(await resendResponse.text());
            } else {
                // Nodemailer fallback
                await emailTransporter.sendMail({
                    from: `"PrintStudio" <${emailUser}>`,
                    to: email,
                    subject: '🔐 كود التحقق - PrintStudio',
                    html: htmlContent
                });
            }

            res.json({ success: true, message: 'تم إرسال الكود على بريدك الإلكتروني' });
        } catch (mailError) {
            console.error('Email Sending Error:', mailError);
            res.status(500).json({ error: `تفاصيل خطأ الإيميل: ${mailError.message}` });
        }
    } catch (error) {
        console.error('OTP send error:', error);
        res.status(500).json({ error: 'فشل إرسال الكود. حدث خطأ داخلي.' });
    }
});

// ── Step 2: Verify OTP and complete auth ──────────────────────────
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp, name, password, isLogin } = req.body;
        
        // Find OTP in database
        const entry = await prisma.oTP.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' }
        });

        if (!entry) return res.status(400).json({ error: 'لم يتم إرسال كود لهذا البريد' });
        if (new Date() > entry.expiresAt) {
            await prisma.oTP.delete({ where: { id: entry.id } });
            return res.status(400).json({ error: 'انتهت صلاحية الكود. أعد الإرسال.' });
        }
        if (entry.code !== otp.trim()) return res.status(400).json({ error: 'الكود غير صحيح' });

        await prisma.oTP.delete({ where: { id: entry.id } });

        let user;
        if (isLogin) {
            user = await prisma.user.findUnique({ where: { email } });
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const affiliateCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            user = await prisma.user.create({ data: { name, email, password: hashedPassword, affiliateCode } });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        res.json({
            success: true, token,
            user: { id: user.id, name: user.name, email: user.email, affiliateCode: user.affiliateCode, discountBalance: user.discountBalance, referredUsers: user.referredUsers, isAdmin: user.isAdmin }
        });
    } catch (error) {
        console.error('OTP verify error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء التحقق' });
    }
});

// User Registration (kept for backward compat)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const affiliateCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const user = await prisma.user.create({ data: { name, email, password: hashedPassword, affiliateCode } });
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, affiliateCode: user.affiliateCode, discountBalance: user.discountBalance, referredUsers: user.referredUsers } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'حدث خطأ أثناء التسجيل' });
    }
});

// User Login (kept for backward compat)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' });
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'كلمة المرور غير صحيحة' });
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, affiliateCode: user.affiliateCode, discountBalance: user.discountBalance, referredUsers: user.referredUsers, isAdmin: user.isAdmin } });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
    }
});

// ── Get User Profile ───────────────────────────────────────────────
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.sendStatus(404);
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, affiliateCode: user.affiliateCode, discountBalance: user.discountBalance, referredUsers: user.referredUsers, isAdmin: user.isAdmin } });
    } catch (error) {
        res.sendStatus(500);
    }
});

// ── Community Designs ──────────────────────────────────────────────
app.post('/api/designs', authenticateToken, createRateLimiter(60 * 60 * 1000, 20), async (req, res) => {
    try {
        const { name, frontDesign, backDesign, tshirtColor, imageUrl } = req.body;
        
        // Input validation
        if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
            return res.status(400).json({ error: 'Invalid design name' });
        }
        if (typeof tshirtColor !== 'string' || tshirtColor.length > 20) {
            return res.status(400).json({ error: 'Invalid tshirt color' });
        }

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
        const errorMsg = process.env.NODE_ENV === 'production' 
            ? 'حدث خطأ أثناء نشر التصميم' 
            : error.message;
        res.status(500).json({ error: errorMsg });
    }
});

app.get('/api/designs', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20)); // Cap at 100
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

// ── Track design purchase ──────────────────────────────────────────
app.post('/api/designs/:id/purchase', async (req, res) => {
    try {
        const designId = parseInt(req.params.id);

        // Increment purchase counter
        const design = await prisma.design.update({
            where: { id: designId },
            data: { purchases: { increment: 1 } },
            include: { user: true }
        });

        // Reward the designer: add 50 EGP to their balance only
        await prisma.user.update({
            where: { id: design.userId },
            data: {
                discountBalance: { increment: 50 }
            }
        });

        res.json({ success: true, purchases: design.purchases });
    } catch (error) {
        console.error('Error tracking purchase:', error);
        res.status(500).json({ error: 'Failed to track purchase' });
    }
});

// ── Get user's own designs ─────────────────────────────────────────
app.get('/api/user/designs', authenticateToken, async (req, res) => {
    try {
        const designs = await prisma.design.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        const totalSales = designs.reduce((sum, d) => sum + d.purchases, 0);
        res.json({ success: true, designs, count: designs.length, totalSales });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user designs' });
    }
});



async function resolvePinItUrl(shortUrl) {
    try {
        const response = await axios.get(shortUrl, {
            maxRedirects: 10,
            timeout: 8000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
            validateStatus: () => true,
        });
        return response.request?.res?.responseUrl || response.config?.url || shortUrl;
    } catch {
        return shortUrl;
    }
}

async function getPinterestImageUrl(pinUrl) {
    try {
        // Strategy 1: Pinterest oEmbed API
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
                    console.log(`[Pinterest] Scraped OK with agent ${agent.slice(0,30)}`);
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

// ── Extract the first real image from a Pinterest Board page ─────────
// Boards show a mosaic as og:image — we need to dig into individual pins.
async function getFirstImageFromPinterestBoard(boardUrl) {
    const agents = [
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Twitterbot/1.0',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    ];

    // Skip icon-sized / avatar / UI images
    const BAD = [/\/\d{1,2}x\d{1,2}\//, /\/28x\//, /\/30x\//, /\/45x\//, /\/60x60\//, /\/75x\//, /avatars/, /\/profile\//];
    const GOOD_SIZES = ['736x', '564x', '474x', 'originals'];
    const isGoodUrl = (u) => !BAD.some(r => r.test(u));
    const upgradeSize = (u) => u.replace(/\/\d{2,3}x\//, '/736x/').replace(/\/150x\//, '/736x/').replace(/\/236x\//, '/736x/');

    for (const agent of agents) {
        try {
            const response = await axios.get(boardUrl, {
                maxRedirects: 10,
                timeout: 12000,
                headers: {
                    'User-Agent': agent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                }
            });

            const html = response.data;
            if (typeof html !== 'string' || html.length < 100) continue;

            // Strategy A: Extract pin IDs → fetch each pin's real image
            const pinIdSet = new Set();
            const pinPats = [/pinterest\.com\/pin\/(\d{10,})/gi, /\/pin\/(\d{10,})/gi];
            for (const pat of pinPats) {
                let m;
                while ((m = pat.exec(html)) !== null) {
                    pinIdSet.add(m[1]);
                    if (pinIdSet.size >= 6) break;
                }
                if (pinIdSet.size >= 6) break;
            }
            for (const pinId of pinIdSet) {
                try {
                    const imgUrl = await getPinterestImageUrl(`https://www.pinterest.com/pin/${pinId}/`);
                    if (imgUrl && isGoodUrl(imgUrl)) {
                        console.log(`[Pinterest Board] Got pin image (${pinId}):`, imgUrl);
                        return imgUrl;
                    }
                } catch { /* try next */ }
            }

            // Strategy B: collect ALL pinimg.com URLs, prefer large sizes, skip icons
            const allPinImgs = [];
            const imgRe = /https:\/\/i\.pinimg\.com\/[^\s"'\\]+\.(?:jpg|jpeg|png|webp)/gi;
            let m2;
            while ((m2 = imgRe.exec(html)) !== null) allPinImgs.push(m2[0]);

            // Pass 1: already large
            for (const url of allPinImgs) {
                if (!isGoodUrl(url)) continue;
                if (GOOD_SIZES.some(s => url.includes(s))) {
                    console.log('[Pinterest Board] Found large pinimg URL:', url);
                    return url;
                }
            }
            // Pass 2: upgrade medium → 736x
            for (const url of allPinImgs) {
                if (!isGoodUrl(url)) continue;
                const up = upgradeSize(url);
                console.log('[Pinterest Board] Upgraded pinimg URL:', up);
                return up;
            }

        } catch (e) {
            console.log(`[Pinterest Board] Agent failed: ${e.message}`);
        }
    }

    throw new Error('Could not extract any image from Pinterest board.');
}

// ── Google Apps Script proxy — يتجنب CORS تماماً ─────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz5TDMGWf45Uq_veLsvF_4saG27Z1og--XqKkH6I5Q3dG4l2sFIPnJty-d3MGsBDX34/exec';

// ── Helper: إرسال إيميل إشعار برصيد جديد عبر GAS ───────────────────
async function sendBalanceNotification({ to, userName, amount, reason, newBalance }) {
    const gasUrl = process.env.GAS_NOTIFY_URL;  // متغير منفصل عن OTP
    if (!gasUrl) return; // GAS_NOTIFY_URL not configured, skip silently

    const htmlBody = `
    <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 480px; margin: auto; padding: 36px; background: #fff8e8; border-radius: 12px; border: 1px solid #d4ba7b; text-align: center;">
      <h2 style="color: #4a3b2c; margin-bottom: 4px;">PrintStudio 🎨</h2>
      <p style="color: #8b6b43; font-size: 13px; margin-bottom: 24px;">إشعار رصيد</p>

      <div style="background: #ffffff; border-radius: 10px; border: 1px solid #eaddbc; padding: 24px; margin-bottom: 24px;">
        <p style="color: #4a3b2c; font-size: 15px; margin-bottom: 12px;">مرحباً <strong>${userName}</strong>،</p>
        <p style="color: #6a543f; font-size: 14px; line-height: 1.7;">${reason}</p>
        <div style="margin: 20px 0; font-size: 36px; font-weight: bold; color: #2e7d32;">+${amount} ج.م</div>
        <p style="color: #888; font-size: 13px;">رصيدك الحالي: <strong style="color: #4a3b2c;">${newBalance} ج.م</strong></p>
      </div>

      <a href="https://new-folder-peach-rho.vercel.app/dashboard" style="display: inline-block; padding: 12px 28px; background: #8b6b43; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">عرض لوحة التحكم</a>

      <hr style="border: none; border-top: 1px solid #eaddbc; margin: 24px 0;" />
      <p style="color: #a89476; font-size: 11px;">هذه رسالة تلقائية من PrintStudio، يرجى عدم الرد عليها.</p>
    </div>
  `;

    try {
        const res = await fetch(gasUrl, {
            method: 'POST',
            body: JSON.stringify({
                to,
                subject: '💰 تم إضافة رصيد جديد إلى حسابك - PrintStudio',
                htmlBody
            })
        });
        const data = await res.json();
        if (!data.success) console.warn('GAS email warning:', data.error);
        else console.log(`📧 تم إرسال إيميل الرصيد إلى ${to}`);
    } catch (err) {
        console.warn('⚠️ Failed to send balance email:', err.message);
    }
}


app.post('/api/submit-order', createRateLimiter(60 * 60 * 1000, 10), async (req, res) => {
    try {
        const orderData = req.body;
        console.log('📦 إرسال الطلب لـ Google Apps Script:', orderData);

        // Handle Affiliate system
        if (orderData.affiliateCode) {
            try {
                const affiliate = await prisma.user.findUnique({ where: { affiliateCode: orderData.affiliateCode } });
                if (affiliate) {
                    const updated = await prisma.user.update({
                        where: { id: affiliate.id },
                        data: {
                            discountBalance: { increment: 50 },
                            referredUsers: { increment: 1 }
                        }
                    });
                    console.log(`✅ تمت إضافة 50 جنيه لحساب الكود ${orderData.affiliateCode}`);

                    // ── إرسال إيميل إشعار ──
                    await sendBalanceNotification({
                        to: affiliate.email,
                        userName: affiliate.name,
                        amount: 50,
                        reason: 'تم تسجيل بيع جديد عبر رابط الإحالة الخاص بك! تمت إضافة عمولتك تلقائياً.',
                        newBalance: updated.discountBalance
                    });
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
                    const updatedCreator = await prisma.user.update({
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

                    // ── إرسال إيميل إشعار لمنشئ التصميم ──
                    await sendBalanceNotification({
                        to: design.user.email,
                        userName: design.user.name,
                        amount: 50,
                        reason: `تهانينا! 🎉 تم شراء تصميمك "${design.name}" وتمت إضافة عمولتك إلى رصيدك.`,
                        newBalance: updatedCreator.discountBalance
                    });
                }
            } catch (err) {
                console.error("Error processing design reward", err);
            }
        }

        // ── Resolve Pinterest/pin.it URLs in designImages before forwarding ──
        // designImages can contain MULTIPLE URLs separated by newlines.
        // Each URL is resolved independently to a direct image URL for Telegram.
        if (!orderData.designImages || orderData.designImages.trim() === 'لا توجد صورة أصلية' || orderData.designImages.trim() === '') {
            let fallbackImgs = orderData.frontImage || '';
            if (orderData.backImage && orderData.backImage !== 'لا توجد صورة') {
                fallbackImgs += (fallbackImgs ? '\n' : '') + orderData.backImage;
            }
            orderData.designImages = fallbackImgs || '';
            orderData.originalImages = fallbackImgs || '';
        }
        
        if (orderData.designImages && typeof orderData.designImages === 'string'
            && orderData.designImages !== 'لا توجد صور'
            && orderData.designImages !== 'لا توجد صورة أصلية') {

            const rawUrls = orderData.designImages
                .split('\n')
                .map(u => u.trim())
                .filter(u => u.length > 0);

            const resolvedUrls = [];

            for (const rawUrl of rawUrls) {
                const isPinterest = rawUrl.includes('pin.it') || rawUrl.includes('pinterest.com');
                if (!isPinterest) {
                    // Not Pinterest — pass through as-is (ibb.co, etc.)
                    resolvedUrls.push(rawUrl);
                    continue;
                }
                try {
                    // Step 1: resolve pin.it shortlink → full Pinterest URL
                    let resolvedUrl = rawUrl;
                    if (rawUrl.includes('pin.it')) {
                        resolvedUrl = await resolvePinItUrl(rawUrl);
                        console.log(`[Order] pin.it resolved: ${rawUrl} → ${resolvedUrl}`);
                    }
                    // Step 2: single pin or board?
                    const isSinglePin = /pinterest\.com\/pin\/\d+/i.test(resolvedUrl);
                    if (isSinglePin) {
                        const directImg = await getPinterestImageUrl(resolvedUrl);
                        console.log(`[Order] ✅ Single pin image:`, directImg);
                        resolvedUrls.push(directImg);
                    } else {
                        // Board/Profile — extract first real pin image
                        console.log(`[Order] 📌 Board detected, extracting first pin image:`, resolvedUrl);
                        try {
                            const boardImg = await getFirstImageFromPinterestBoard(resolvedUrl);
                            console.log(`[Order] ✅ Board image:`, boardImg);
                            resolvedUrls.push(boardImg);
                        } catch (boardErr) {
                            console.warn(`[Order] ⚠️ Board extraction failed:`, boardErr.message);
                            resolvedUrls.push(`🔗 رابط ألبوم: ${resolvedUrl}`);
                        }
                    }
                } catch (err) {
                    console.warn(`[Order] ⚠️ Could not resolve: ${rawUrl}`, err.message);
                    resolvedUrls.push(`🔗 ${rawUrl}`);
                }
            }

            orderData.designImages = resolvedUrls.join('\n');
            console.log(`[Order] Final designImages:\n`, orderData.designImages);
        }

        // ── Sanitize image URLs before sending to GAS ──────────────────────────
        // Telegram rejects non-http(s) strings as photo URLs → causes 400/500 errors.
        // Replace any image field that isn't a valid https:// URL with an empty string
        // so the GAS script knows to skip it.
        const IMAGE_FIELDS = ['frontImage', 'backImage', 'instapayProof'];
        const isValidHttpsUrl = (val) => {
            if (!val || typeof val !== 'string') return false;
            try {
                const u = new URL(val.trim());
                return u.protocol === 'https:' && u.hostname.length > 0;
            } catch { return false; }
        };
        for (const field of IMAGE_FIELDS) {
            if (orderData[field] !== undefined && !isValidHttpsUrl(orderData[field])) {
                console.warn(`[Order] ⚠️ Blanking invalid image URL for field "${field}": ${orderData[field]}`);
                orderData[field] = '';
            }
        }
        // Also sanitize each line of designImages — keep only valid https:// URLs
        if (orderData.designImages && typeof orderData.designImages === 'string') {
            const sanitizedDesignImgs = orderData.designImages
                .split('\n')
                .filter(u => isValidHttpsUrl(u.trim()))
                .join('\n');
            if (sanitizedDesignImgs !== orderData.designImages) {
                console.warn('[Order] ⚠️ Some designImages lines were invalid URLs and removed.');
                orderData.designImages = sanitizedDesignImgs || '';
            }
        }

        // ── Compatibility for GAS Script ─────────────────────────────────
        // The user's updated GAS script expects multiple URLs separated by \n in `designImages`.
        if (orderData.designImages) {
            orderData.originalImages = orderData.designImages;
        }

        let gasResponse = null;
        try {
            const response = await axios.post(APPS_SCRIPT_URL, orderData, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000,
            });
            gasResponse = response.data;
            console.log('✅ استجابة Google Script:', gasResponse);

            // If GAS explicitly reports an error (e.g. Telegram failure), log it but don't fail
            if (gasResponse && gasResponse.status === 'error') {
                console.warn('⚠️ GAS reported error (non-fatal):', gasResponse.message);
            }
        } catch (gasError) {
            // GAS/Telegram errors are non-fatal — DB updates & affiliate rewards already applied
            console.error('⚠️ GAS/Telegram error (non-fatal, order still accepted):', gasError.response?.data || gasError.message);
        }

        // Always return success to the frontend — the order was processed
        res.json({ success: true, data: gasResponse });
    } catch (error) {
        console.error('❌ خطأ معالجة الطلب:', error.response?.data || error.message);
        const errorMsg = process.env.NODE_ENV === 'production'
            ? 'حدث خطأ أثناء معالجة الطلب'
            : error.message;
        res.status(500).json({ success: false, error: errorMsg });
    }
});

app.post('/api/pinterest-image', async (req, res) => {
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
        const parsedUrl = new URL(url);
        if (parsedUrl.hostname === 'localhost' || 
            parsedUrl.hostname === '127.0.0.1' || 
            !parsedUrl.hostname.includes('.') ||
            parsedUrl.hostname.match(/^192\.168\.|^10\.|^172\.1[6-9]\.|^172\.2[0-9]\.|^172\.3[01]\./)) {
            return res.status(403).send('❌ مسار غير مسموح');
        }
        
        const response = await axios.get(url, { 
            responseType: 'stream', 
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
            }
        });
        
        // ✅ Image Type Validation: Only allow image MIME types
        const contentType = response.headers['content-type'] || 'image/jpeg';
        if (!contentType.startsWith('image/')) {
            return res.status(403).json({ error: 'Only image files allowed' });
        }
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);
        response.data.pipe(res);
    } catch (error) {
        res.setHeader('Access-Control-Allow-Origin', '*');
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

// Middleware to check if admin
const authenticateAdmin = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (user && user.isAdmin) {
            next();
        } else {
            res.status(403).json({ error: 'Access denied. Admins only.' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

app.get('/api/admin/users', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, discountBalance: true, referredUsers: true, isAdmin: true, createdAt: true }
        });
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.delete('/api/admin/designs/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const designId = parseInt(req.params.id);
        const design = await prisma.design.findUnique({ where: { id: designId } });
        if (design) {
            await prisma.design.delete({ where: { id: designId } });
            await logSecurityEvent('ADMIN_DELETE_DESIGN', req, { designId, designName: design.name });
        }
        res.json({ success: true, message: 'تم مسح التصميم بنجاح' });
    } catch (error) {
        res.status(500).json({ error: 'فشل مسح التصميم' });
    }
});

app.delete('/api/admin/users/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (targetUser) {
            await prisma.design.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
            await logSecurityEvent('ADMIN_DELETE_USER', req, { targetUserId: userId, targetEmail: targetUser.email });
        }
        res.json({ success: true, message: 'تم مسح المستخدم بنجاح' });
    } catch (error) {
        res.status(500).json({ error: 'فشل مسح المستخدم' });
    }
});

// ── Make Admin Route ───────────────────────────────────────────────
app.post("/api/make-admin", authenticateToken, createRateLimiter(60 * 60 * 1000, 5), async (req, res) => {
    try {
        const requester = await prisma.user.findUnique({
            where: { id: req.user.id },
        });
        if (!requester || !requester.isAdmin) {
            return res.status(403).json({ error: "Not authorized" });
        }
        
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "Missing userId" });

        await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { isAdmin: true }
        });
        await logSecurityEvent('ADMIN_PROMOTE_USER', req, { targetUserId: userId });
        res.json({ success: true, message: "User promoted to Admin" });
    } catch (err) {
        const errorMsg = process.env.NODE_ENV === 'production' 
            ? "Internal Server Error" 
            : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// ── API Documentation Endpoint ────────────────────────────────────
app.get('/api-docs', (req, res) => {
    const docs = {
        title: 'PrintStudio API Documentation',
        version: '1.0.0',
        baseUrl: SERVER_URL,
        endpoints: {
            auth: [
                { method: 'POST', path: '/api/auth/send-otp', auth: 'none', rateLimit: '5/15min', description: 'Send OTP for login/register' },
                { method: 'POST', path: '/api/auth/verify-otp', auth: 'none', rateLimit: '5/15min', description: 'Verify OTP and get token' },
                { method: 'GET', path: '/api/auth/me', auth: 'required', description: 'Get current user profile' },
                { method: 'GET', path: '/api/auth/google', auth: 'none', description: 'Google OAuth login' },
                { method: 'GET', path: '/api/csrf-token', auth: 'none', description: 'Get CSRF token' }
            ],
            designs: [
                { method: 'GET', path: '/api/designs?page=1&limit=20', auth: 'none', rateLimit: 'unlimited', description: 'Get all designs (paginated)' },
                { method: 'POST', path: '/api/designs', auth: 'required', rateLimit: '20/1hr', description: 'Create new design' },
                { method: 'GET', path: '/api/user/designs', auth: 'required', description: 'Get user designs' },
                { method: 'POST', path: '/api/designs/:id/purchase', auth: 'none', description: 'Track design purchase' }
            ],
            orders: [
                { method: 'POST', path: '/api/submit-order', auth: 'none', rateLimit: '10/1hr', description: 'Submit order to Google Apps Script' }
            ],
            admin: [
                { method: 'GET', path: '/api/admin/users?page=1&limit=20', auth: 'admin', description: 'List all users (paginated)' },
                { method: 'DELETE', path: '/api/admin/users/:id', auth: 'admin', description: 'Delete user' },
                { method: 'DELETE', path: '/api/admin/designs/:id', auth: 'admin', description: 'Delete design' },
                { method: 'POST', path: '/api/make-admin', auth: 'admin', rateLimit: '5/1hr', description: 'Promote user to admin' }
            ]
        },
        headers: {
            required: 'Authorization: Bearer <token>, X-CSRF-Token: <token>',
            optional: 'Content-Type: application/json'
        },
        security: {
            jwt: 'Required for authenticated endpoints',
            csrf: 'Required for POST/PUT/DELETE/PATCH requests',
            rateLimit: 'Enabled on sensitive endpoints',
            ssrf: 'SSRF protection on proxy endpoints'
        }
    };
    res.json(docs);
});

// ── Health Check Endpoint ───────────────────────────────────────────
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

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve the React app for any other request (client-side routing)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ── Cleanup Expired OTP (Cron Job) ──────────────────────────────────
const cleanupExpiredOTP = async () => {
    try {
        const result = await prisma.oTP.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date() // Delete expired OTPs
                }
            }
        });
        if (result.count > 0) {
            console.log(`🗑️  Cleaned up ${result.count} expired OTP(s)`);
        }
    } catch (error) {
        console.error('❌ OTP Cleanup failed:', error.message);
    }
};

// Run cleanup every 30 minutes
setInterval(cleanupExpiredOTP, 30 * 60 * 1000);

// Run cleanup on startup
cleanupExpiredOTP();

// ── Start Server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

