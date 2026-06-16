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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
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
    origin: process.env.CLIENT_URL || 'https://new-folder-peach-rho.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

        // Return JWT to frontend via redirect
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        const userData = encodeURIComponent(JSON.stringify({
            id: user.id, name: user.name, email: user.email,
            affiliateCode: user.affiliateCode, discountBalance: user.discountBalance,
            referredUsers: user.referredUsers, isAdmin: user.isAdmin, avatarUrl: user.avatarUrl
        }));
        res.redirect(`${CLIENT_URL}/auth/google/success?token=${token}&user=${userData}`);

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

// ── Step 1: Send OTP (register or login) ──────────────────────────
app.post('/api/auth/send-otp', async (req, res) => {
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
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store pending data
        otpStore.set(email, { otp, expires, pendingData: { name, email, password, isLogin } });

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
        const { email, otp } = req.body;
        const entry = otpStore.get(email);

        if (!entry) return res.status(400).json({ error: 'لم يتم إرسال كود لهذا البريد' });
        if (Date.now() > entry.expires) {
            otpStore.delete(email);
            return res.status(400).json({ error: 'انتهت صلاحية الكود. أعد الإرسال.' });
        }
        if (entry.otp !== otp.trim()) return res.status(400).json({ error: 'الكود غير صحيح' });

        otpStore.delete(email);
        const { name, password, isLogin } = entry.pendingData;

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

app.get('/api/test-reward', async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) return res.send("No code");
        const affiliate = await prisma.user.findUnique({ where: { affiliateCode: code } });
        if (!affiliate) return res.send("Not found");
        await prisma.user.update({
            where: { id: affiliate.id },
            data: { discountBalance: { increment: 50 }, referredUsers: { increment: 1 } }
        });
        res.send("Success");
    } catch (e) {
        res.send("Error: " + e.message);
    }
});

app.post('/api/submit-order', async (req, res) => {
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
        const parsedUrl = new URL(url);
        if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1' || !parsedUrl.hostname.includes('.')) {
            return res.status(403).send('❌ مسار غير مسموح');
        }
        
        const response = await axios.get(url, { responseType: 'stream', timeout: 5000 });
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
        response.data.pipe(res);
    } catch (error) {
        res.status(500).send('Error proxying image');
    }
});
// ── Make Admin Route ───────────────────────────────────────────────
app.get('/api/make-andro-admin', async (req, res) => {
    // Protected by a secret parameter
    if (req.query.secret !== (process.env.ADMIN_SECRET || 'admin12345')) {
        return res.status(403).send('<h1 style="color:red; text-align:center; margin-top:50px;">❌ غير مصرح لك!</h1>');
    }
    
    try {
        const nameParam = req.query.name;
        const emailParam = req.query.email;

        let where = {};
        if (emailParam) {
            where = { email: emailParam };
        } else if (nameParam) {
            where = { name: nameParam };
        } else {
            where = { name: 'ANDRO' }; // default fallback
        }

        const result = await prisma.user.updateMany({
            where,
            data: { isAdmin: true }
        });

        if (result.count === 0) {
            return res.send('<h1 style="color:red; text-align:center; margin-top:50px;">❌ لم يتم العثور على أي مستخدم بهذا الاسم أو الإيميل.</h1>');
        }

        const target = emailParam || nameParam || 'ANDRO';
        res.send(`<h1 style="color:green; text-align:center; margin-top:50px;">✅ تمت الترقية بنجاح! (${target}) أصبح أدمن الآن.<br><br><small style="font-size:16px; color:#555;">قم بتسجيل الخروج والدخول مرة أخرى في موقعك.</small></h1>`);
    } catch (error) {
        res.send('Error: ' + error.message);
    }
});
// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve the React app for any other request (client-side routing)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ── Start Server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

