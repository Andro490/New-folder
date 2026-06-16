// ═══════════════════════════════════════════════════════════════
//  ⚙️  SITE CONFIGURATION — Edit from here without touching code
//  Just change the values below to control the entire site
// ═══════════════════════════════════════════════════════════════

export const appConfig = {

  // ─── 🏪 Site Info ────────────────────────────────────────────
  site: {
    name: 'PrintStudio',
    tagline: 'Design Your Own T-Shirt',
    taglineAr: 'صمّم تيشرتك بنفسك',
    logoText: 'PrintStudio',
    supportEmail: 'emelnasr@gmail.com',
    whatsappNumber: '+201144231586', // Format: +20xxxxxxxxxx
  },

  // ─── 💰 Pricing ─────────────────────────────────────────────
  pricing: {
    basePrice: 500,        // Base design price in EGP
    currencyEn: 'EGP',
    currencyAr: 'جنيه',
    affiliateReward: 50,   // EGP earned per referred purchase
  },

  // ─── 🚚 Shipping ─────────────────────────────────────────────
  shipping: {
    standard: {
      enabled: true,
      priceEGP: 0,         // 0 = free
      labelEn: 'Standard Shipping (Free)',
      labelAr: 'شحن عادي (مجاني)',
    },
    premium: {
      enabled: true,
      priceEGP: 70,
      labelEn: 'Premium Shipping',
      labelAr: 'شحن سريع (مميز)',
    },
  },

  // ─── 💳 Payment Methods ───────────────────────────────────────
  payment: {
    cashOnDelivery: {
      enabled: true,
      labelEn: 'Cash on Delivery',
      labelAr: 'الدفع عند الاستلام',
    },
    instapay: {
      enabled: true,
      labelEn: 'Instapay Transfer',
      labelAr: 'تحويل Instapay',
      phoneNumber: '01000026470', // Your Instapay phone number
    },
  },

  // ─── 👕 Products (Coming Soon Control) ───────────────────────
  products: {
    tshirt: {
      enabled: true,        // ✅ Active — do not disable
      nameEn: 'T-Shirt',
      nameAr: 'تيشيرت',
    },
    sweatpants: {
      enabled: false,       // 🔒 false = shows "COMING SOON", true = opens the page
      nameEn: 'Sweatpants',
      nameAr: 'بنطلون رياضي',
    },
    sweatshirt: {
      enabled: false,       // 🔒 false = shows "COMING SOON", true = opens the page
      nameEn: 'Sweatshirt',
      nameAr: 'هودي',
    },
  },

  // ─── 📐 Fits (Coming Soon Control) ───────────────────────────
  fits: {
    regularFit: {
      enabled: true,
      nameEn: 'Regular Fit',
      nameAr: 'قصة عادية',
    },
    boxyFit: {
      enabled: false,
      nameEn: 'Boxy Fit',
      nameAr: 'قصة صندوقية',
    },
    oversize: {
      enabled: true,       // 🔒 false = shows "COMING SOON", true = opens color step
      nameEn: 'Oversize',
      nameAr: 'أوفر سايز',
    },
  },

  // ─── 🎨 T-Shirt Colors ─────────────────────────────────────────
  tshirtColors: {
    white: {
      enabled: true,
      nameEn: 'White',
      nameAr: 'أبيض',
    },
    black: {
      enabled: true,
      nameEn: 'Black',
      nameAr: 'أسود',
    },
  },

  // ─── 🖼️ Community / Gallery ──────────────────────────────────
  community: {
    hoodiesCategory: {
      enabled: false,       // 🔒 false = shows as disabled filter
    },
    showPriceOnCards: true, // Show/hide price badges on design cards
    allowBuyingDesigns: true, // Allow clicking "Buy Design" on community cards
  },

  // ─── 📱 Social Links ──────────────────────────────────────────
  social: {
    instagram: 'https://instagram.com/printstudio',
    tiktok: 'https://tiktok.com/@printstudio',
    facebook: 'https://facebook.com/printstudio',
    twitter: '',            // Leave empty to hide the link
  },

};

