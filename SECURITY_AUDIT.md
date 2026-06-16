# تقرير الثغرات الأمنية - PrintStudio App 🔒

**تاريخ التقرير:** 2026-06-16  
**المستوى الكلي للخطورة:** 🔴 **عالي جداً**

---

## 📋 جدول المحتويات

1. [الثغرات الحرجة](#الثغرات-الحرجة)
2. [الثغرات العالية](#الثغرات-العالية)
3. [الثغرات المتوسطة](#الثغرات-المتوسطة)
4. [الثغرات المنخفضة](#الثغرات-المنخفضة)
5. [التوصيات](#التوصيات)

---

## 🔴 الثغرات الحرجة

### 1. **Unrestricted Admin Endpoint** ⚠️ خطير جداً

**الموقع:** `server.js` - السطر ~450  
**الشدة:** 🔴 **حرجة**

```javascript
app.get('/api/make-andro-admin', async (req, res) => {
    try {
        await prisma.user.updateMany({
            where: { name: 'ANDRO' },
            data: { isAdmin: true }
        });
        res.send('<h1>تمت الترقية بنجاح!</h1>');
    }
});
```

**المشكلة:**

- ❌ بدون أي تحقق من الهوية (`authenticateToken`)
- ❌ يمكن لأي شخص تسجيل دخول بـ اسم "ANDRO" وأصبح admin
- ❌ بدون حماية CSRF
- ❌ لا يوجد rate limiting

**الخطر:**

- الدخول غير المصرح إلى لوحة التحكم
- حذف/تعديل جميع البيانات
- سرقة معلومات العملاء والتصاميم

**الحل:**

```javascript
app.post("/api/make-admin", authenticateToken, async (req, res) => {
  // تحقق من أن الشخص هو admin بالفعل
  const requester = await prisma.user.findUnique({
    where: { id: req.user.id },
  });
  if (!requester?.isAdmin)
    return res.status(403).json({ error: "Not authorized" });

  const { userId } = req.body;
  await prisma.user.update({ where: { id: userId }, data: { isAdmin: true } });
});
```

---

### 2. **Hardcoded Weak JWT Secret** 🔑

**الموقع:** `server.js` - السطر 18, `api/index.js` - السطر 6  
**الشدة:** 🔴 **حرجة**

```javascript
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";
```

**المشكلة:**

- ❌ JWT Secret ضعيفة جداً ("supersecretkey123")
- ❌ يمكن فك تشفير التوكنات بسهولة
- ❌ Default value في الكود يعني استخدامه في production!

**الخطر:**

- انتحال هوية أي مستخدم
- الوصول إلى حسابات المستخدمين الآخرين
- تعديل بيانات حساسة

**الحل:**

```javascript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET not set in environment!");
  process.exit(1);
}
// استخدم: openssl rand -hex 32 لتوليد secret قوية
```

---

### 3. **CORS Completely Open to All Origins** 🌐

**الموقع:** `server.js` - السطور 43-49  
**الشدة:** 🔴 **حرجة**

```javascript
app.use(
  cors({
    origin: "*", // ❌ خطير!
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    optionsSuccessStatus: 200,
  }),
);
```

**المشكلة:**

- ❌ أي موقع يمكنه عمل requests من المستخدمين
- ❌ عدم وجود CSRF protection
- ❌ يمكن لـ malicious sites عمل API calls نيابة عن المستخدمين

**الخطر:**

- CSRF attacks من مواقع خبيثة
- سحب بيانات المستخدمين
- تعديل الطلبات والبيانات

**الحل:**

```javascript
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
```

---

### 4. **SQL Injection في Search Parameters** 🗄️

**الموقع:** Multiple endpoints لا تقوم بـ input validation  
**الشدة:** 🔴 **حرجة** (في حال وجود search functionality)

**المشكلة:**

- ❌ عدم التحقق من صحة البيانات الداخلة (input validation)
- ❌ Prisma آمنة من SQL injection لكن العملية تحتاج validation

**الحل:**

```javascript
// استخدم validation library مثل:
import { z } from "zod";

const designSchema = z.object({
  name: z.string().min(1).max(100),
  frontDesign: z.string(),
  backDesign: z.string(),
  tshirtColor: z.string().regex(/^#[0-9A-F]{6}$/i),
});

app.post("/api/designs", authenticateToken, async (req, res) => {
  const validated = designSchema.parse(req.body);
  // استخدم validated data فقط
});
```

---

## 🟠 الثغرات العالية

### 5. **TLS Certificate Verification Disabled** 🔐

**الموقع:** `server.js` - السطر 28-30  
**الشدة:** 🟠 **عالية**

```javascript
tls: {
  rejectUnauthorized: false; // ❌ خطير في production!
}
```

**المشكلة:**

- ❌ يسمح بـ Man-in-the-Middle attacks
- ❌ رسائل الإيميل قد تُعترض
- ❌ بيانات المستخدمين قد تُسحب

**الحل:**

```javascript
// في production:
tls: {
  rejectUnauthorized: true; // ✅ افتراضي صحيح
}
// أو احذفها تماماً
```

---

### 6. **User Data Exposed in URL Parameters** 👤

**الموقع:** `server.js` - السطر 95-96  
**الشدة:** 🟠 **عالية**

```javascript
const userData = encodeURIComponent(
  JSON.stringify({
    id: user.id,
    name: user.name,
    email: user.email,
    affiliateCode: user.affiliateCode,
    discountBalance: user.discountBalance,
    referredUsers: user.referredUsers,
    isAdmin: user.isAdmin,
    avatarUrl: user.avatarUrl,
  }),
);
res.redirect(
  `${CLIENT_URL}/auth/google/success?token=${token}&user=${userData}`,
);
```

**المشكلة:**

- ❌ البيانات الحساسة في URL قد تُسجل في browser history
- ❌ قد تُسجل في server logs
- ❌ قد تُمرر إلى third-party analytics

**الحل:**

```javascript
// استخدم POST request أو Session Storage:
res.cookie("userData", JSON.stringify(userData), {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  maxAge: 5 * 60 * 1000, // 5 دقائق
});
res.redirect(`${CLIENT_URL}/auth/google/success?token=${token}`);
```

---

### 7. **No Rate Limiting on Authentication Endpoints** 🔓

**الموقع:** `/api/auth/send-otp`, `/api/auth/verify-otp`  
**الشدة:** 🟠 **عالية**

**المشكلة:**

- ❌ بدون rate limiting
- ❌ يمكن عمل brute force attacks
- ❌ يمكن flood الـ OTP system

**الخطر:**

- Brute force على كلمات المرور
- DDoS attacks على خدمة الإيميل
- اختبار البريد الإلكتروني لمعرفة المستخدمين

**الحل:**

```javascript
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 محاولات فقط
  message: "عدد المحاولات كثير جداً، حاول بعد 15 دقيقة",
  skip: (req) => req.user?.isAdmin, // الـ admins معفيون
});

app.post("/api/auth/send-otp", authLimiter, async (req, res) => {
  /* ... */
});
app.post("/api/auth/verify-otp", authLimiter, async (req, res) => {
  /* ... */
});
```

---

### 8. **OTP Stored in Memory (Volatile)** 💾

**الموقع:** `server.js` - السطر 50  
**الشدة:** 🟠 **عالية**

```javascript
const otpStore = new Map(); // ❌ خطير!
```

**المشكلة:**

- ❌ OTP codes تُمسح عند restart السيرفر
- ❌ في production مع multiple servers، OTP من server 1 لا يعمل في server 2
- ❌ لا يوجد persistence

**الحل:**

```javascript
// استخدم Redis أو Database:
app.post("/api/auth/send-otp", async (req, res) => {
  const otp = generateOTP();
  await prisma.oTP.create({
    data: {
      email: req.body.email,
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
});
```

---

### 9. **No Input Validation on Image URLs** 🖼️

**الموقع:** `api/index.js` - `/api/proxy-image`  
**الشدة:** 🟠 **عالية**

```javascript
app.get('/api/proxy-image', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('No url provided');

    try {
        const response = await axios.get(url, { responseType: 'stream' });
        // ❌ بدون تحقق من الـ URL!
```

**المشكلة:**

- ❌ يمكن استخدام الـ proxy لـ SSRF attacks
- ❌ الوصول إلى internal networks (127.0.0.1, 192.168.x.x)
- ❌ الوصول إلى sensitive endpoints على نفس السيرفر

**الحل:**

```javascript
import { URL } from 'url';

app.get('/api/proxy-image', async (req, res) => {
    const { url } = req.query;

    try {
        const parsedUrl = new URL(url);

        // ❌ منع الـ private IPs
        if (parsedUrl.hostname === 'localhost' ||
            parsedUrl.hostname === '127.0.0.1' ||
            parsedUrl.hostname.match(/^192\.168\.|^10\.|^172\.1[6-9]\.|^172\.2[0-9]\.|^172\.3[01]\./)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const response = await axios.get(url, {
            responseType: 'stream',
            timeout: 5000
        });
```

---

### 10. **Password Validation Too Weak** 🔐

**الموقع:** `/api/auth/send-otp`  
**الشدة:** 🟠 **عالية**

**المشكلة:**

- ❌ بدون minimum length requirement
- ❌ بدون complexity requirements
- ❌ لا يوجد check للـ common passwords

**الحل:**

```javascript
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    if (password.length < minLength) return false;
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) return false;

    // تحقق من common passwords
    const commonPasswords = ['123456', 'password', 'admin123', ...];
    if (commonPasswords.includes(password.toLowerCase())) return false;

    return true;
}
```

---

## 🟡 الثغرات المتوسطة

### 11. **No HTTPS Enforcement** 🔒

**الموقع:** جميع requests  
**الشدة:** 🟡 **متوسطة**

**المشكلة:**

- ❌ بدون redirect من HTTP إلى HTTPS
- ❌ بدون HSTS header

**الحل:**

```javascript
// في production:
app.use((req, res, next) => {
  if (req.header("x-forwarded-proto") !== "https") {
    return res.redirect(`https://${req.header("host")}${req.url}`);
  }
  next();
});

// أضف HSTS header:
app.use((req, res, next) => {
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  next();
});
```

---

### 12. **No Content Security Policy (CSP)** 🛡️

**الموقع:** Response headers  
**الشدة:** 🟡 **متوسطة**

**الخطر:**

- XSS attacks قد تحقن scripts ضارة
- جلب resources من مصادر خبيثة

**الحل:**

```javascript
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https:;",
  );
  next();
});
```

---

### 13. **No CSRF Protection Token** 🔀

**الموقع:** All POST/DELETE endpoints  
**الشدة:** 🟡 **متوسطة**

**المشكلة:**

- ❌ بدون CSRF tokens
- ❌ Cross-Site Request Forgery attacks ممكنة

**الحل:**

```javascript
import csrf from "csurf";
import cookieParser from "cookie-parser";

app.use(cookieParser());
const csrfProtection = csrf({ cookie: false });

app.post(
  "/api/designs",
  authenticateToken,
  csrfProtection,
  async (req, res) => {
    // الـ csrf token تحقق تلقائياً
    // ...
  },
);
```

---

### 14. **Insufficient Logging and Monitoring** 📊

**الموقع:** جميع endpoints  
**الشدة:** 🟡 **متوسطة**

**المشكلة:**

- ❌ بدون audit logs للـ admin actions
- ❌ بدون security event logging
- ❌ بدون monitoring للـ suspicious activity

**الحل:**

```javascript
async function logSecurityEvent(event, user, details) {
  await prisma.securityLog.create({
    data: {
      event,
      userId: user?.id,
      userEmail: user?.email,
      details: JSON.stringify(details),
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      timestamp: new Date(),
    },
  });
}
```

---

### 15. **No Database Query Logging** 🗄️

**الموقع:** Prisma queries  
**الشدة:** 🟡 **متوسطة**

**المشكلة:**

- ❌ صعوبة تتبع data access
- ❌ عدم معرفة من حذف أو عدّل البيانات

**الحل:**

```javascript
const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

// في production استخدم monitoring tool
```

---

## 🟢 الثغرات المنخفضة

### 16. **No Pagination on API Endpoints** 📄

**الموقع:** `/api/designs`, `/api/admin/users`  
**الشدة:** 🟢 **منخفضة**

**المشكلة:**

- ❌ سحب جميع البيانات دفعة واحدة
- ❌ performance issues مع عدد كبير من البيانات

**الحل:**

```javascript
app.get("/api/designs", async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const designs = await prisma.design.findMany({
    skip,
    take: parseInt(limit),
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.design.count();
  res.json({ success: true, designs, total, pages: Math.ceil(total / limit) });
});
```

---

### 17. **No API Documentation** 📖

**الموقع:** API endpoints  
**الشدة:** 🟢 **منخفضة**

**الحل:**
استخدم Swagger/OpenAPI:

```bash
npm install swagger-ui-express swagger-jsdoc
```

---

### 18. **Error Messages Too Detailed** ⚠️

**الموقع:** Error responses  
**الشدة:** 🟢 **منخفضة**

**المشكلة:**

```javascript
// ❌ خطر:
res.status(500).json({ error: error.message }); // قد يكشف database details
```

**الحل:**

```javascript
// ✅ آمن:
if (process.env.NODE_ENV === "production") {
  res.status(500).json({ error: "An error occurred. Please try again." });
} else {
  res.status(500).json({ error: error.message });
}
```

---

## 📋 التوصيات

### أولويات الإصلاح:

1. **فوراً (Critical):**
   - ✅ حذف `/api/make-andro-admin` endpoint
   - ✅ تغيير JWT_SECRET القوية
   - ✅ تقييد CORS
   - ✅ إضافة input validation

2. **ضروري (High):**
   - ✅ إضافة rate limiting
   - ✅ حماية TLS certificates
   - ✅ إخفاء user data من URLs
   - ✅ تحسين password validation

3. **مهم (Medium):**
   - ✅ إضافة security headers
   - ✅ CSRF protection
   - ✅ Audit logging

4. **بعده (Low):**
   - ✅ Pagination
   - ✅ API Documentation
   - ✅ Better error handling

---

## 🛠️ أدوات Security مقترحة

```bash
npm install \
  express-rate-limit \
  helmet \
  express-validator \
  zod \
  csrf \
  cookie-parser \
  jsonwebtoken \
  bcryptjs
```

### مثال للـ Helmet setup:

```javascript
import helmet from "helmet";

app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  }),
);
```

---

## 📊 ملخص الثغرات

| رقم | الثغرة                      | الشدة     | الحالة             |
| --- | --------------------------- | --------- | ------------------ |
| 1   | Unrestricted Admin Endpoint | 🔴 حرجة   | ⏳ بانتظار الإصلاح |
| 2   | Weak JWT Secret             | 🔴 حرجة   | ⏳ بانتظار الإصلاح |
| 3   | CORS Open to All            | 🔴 حرجة   | ⏳ بانتظار الإصلاح |
| 4   | SQL Injection Risk          | 🔴 حرجة   | ⏳ بانتظار الإصلاح |
| 5   | TLS Disabled                | 🟠 عالية  | ⏳ بانتظار الإصلاح |
| 6   | Data in URL                 | 🟠 عالية  | ⏳ بانتظار الإصلاح |
| 7   | No Rate Limiting            | 🟠 عالية  | ⏳ بانتظار الإصلاح |
| 8   | OTP in Memory               | 🟠 عالية  | ⏳ بانتظار الإصلاح |
| 9   | No Image URL Validation     | 🟠 عالية  | ⏳ بانتظار الإصلاح |
| 10  | Weak Password Validation    | 🟠 عالية  | ⏳ بانتظار الإصلاح |
| 11  | No HTTPS Enforcement        | 🟡 متوسطة | ⏳ بانتظار الإصلاح |
| 12  | No CSP Headers              | 🟡 متوسطة | ⏳ بانتظار الإصلاح |
| 13  | No CSRF Protection          | 🟡 متوسطة | ⏳ بانتظار الإصلاح |
| 14  | No Audit Logging            | 🟡 متوسطة | ⏳ بانتظار الإصلاح |
| 15  | No Query Logging            | 🟡 متوسطة | ⏳ بانتظار الإصلاح |
| 16  | No Pagination               | 🟢 منخفضة | ⏳ بانتظار الإصلاح |
| 17  | No API Documentation        | 🟢 منخفضة | ⏳ بانتظار الإصلاح |
| 18  | Detailed Errors             | 🟢 منخفضة | ⏳ بانتظار الإصلاح |

---

## ⚠️ ملاحظة مهمة

**هذا التطبيق غير آمن الآن للاستخدام في production!**

يجب إصلاح جميع الثغرات الحرجة على الأقل قبل الإطلاق العام.

---

**تم التقرير بواسطة:** Security Audit Tool  
**التاريخ:** 2026-06-16  
**الحالة:** ⏳ بانتظار الإصلاح
