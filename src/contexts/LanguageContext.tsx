import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';

export const translations = {
  en: {
    navbar: {
      store: 'Store',
      design: 'Design T-Shirt',
      dashboard: 'Dashboard',
      admin: 'Admin Panel',
      logout: 'Logout',
      login: 'Login'
    },
    home: {
      selectProduct: 'SELECT PRODUCT',
      chooseCanvas: 'Choose your canvas',
      comingSoon: 'COMING SOON',
      tshirt: 'T-SHIRT',
      getStarted: 'GET STARTED',
      designTshirt: 'Design Your T-Shirt',
      whichFit: 'WHICH FIT DO YOU PREFER?',
      defineSilhouette: 'Define the silhouette',
      oversize: 'OVERSIZE',
      regularFit: 'REGULAR FIT',
      boxyFit: 'BOXY FIT',
      selectColor: 'SELECT COLOR',
      setTone: 'Set the tone',
      white: 'WHITE',
      black: 'BLACK',
      front: 'FRONT',
      back: 'BACK'
    },
    auth: {
      loginTitle: 'Login',
      registerTitle: 'Create Account',
      fullName: 'Full Name',
      email: 'Email Address',
      password: 'Password',
      loginBtn: 'Login',
      registerBtn: 'Register',
      noAccount: 'Don\'t have an account? ',
      haveAccount: 'Already have an account? ',
      registerNow: 'Register Now',
      loginNow: 'Login Now'
    },
    dashboard: {
      loading: 'Loading...',
      welcome: 'Welcome',
      subtitle: 'Welcome to your dashboard. Sell your fashion designs here.',
      affiliateLink: 'Your Affiliate Link',
      affiliateDesc: 'Share this link with your friends or clients and earn 50 EGP per purchase.',
      copied: 'Copied!',
      copy: 'Copy',
      balance: 'Current Balance',
      currency: 'EGP',
      referred: 'Referred Users',
      person: 'Person',
      totalSales: 'Total Sales',
      order: 'Order',
      designs: 'Published Designs',
      design: 'Design'
    },
    community: {
      title: 'Community Gallery',
      subtitle: 'Discover creative designs, buy what you like and support the creators',
      filterMenu: 'Filter Menu',
      categories: 'Categories',
      all: 'All',
      tshirts: 'T-Shirts',
      hoodies: 'Hoodies (Soon)',
      featuredArtists: 'Featured Artists',
      allArtists: 'Everyone',
      noDesigns: 'No designs match your search.',
      noImage: 'No Image',
      designedBy: 'Designed by: ',
      unknownArtist: 'Unknown',
      buyDesign: 'Buy Design'
    }
  },
  ar: {
    navbar: {
      store: 'متجر',
      design: 'صمم تيشيرتك',
      dashboard: 'لوحة التحكم',
      admin: 'لوحة الإدارة',
      logout: 'تسجيل الخروج',
      login: 'تسجيل الدخول'
    },
    home: {
      selectProduct: 'اختر المنتج',
      chooseCanvas: 'اختر ما يناسبك',
      comingSoon: 'قريباً',
      tshirt: 'تيشيرت',
      getStarted: 'ابدأ التصميم',
      designTshirt: 'صمّم تيشرتك',
      whichFit: 'أي قَصّة تفضل؟',
      defineSilhouette: 'حدد القصة',
      oversize: 'أوفر سايز',
      regularFit: 'عادي (Regular Fit)',
      boxyFit: 'صندوقي (Boxy Fit)',
      selectColor: 'اختر اللون',
      setTone: 'حدد لونك',
      white: 'أبيض',
      black: 'أسود',
      front: 'أمامي',
      back: 'خلفي'
    },
    auth: {
      loginTitle: 'تسجيل الدخول',
      registerTitle: 'إنشاء حساب',
      fullName: 'الاسم كامل',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      loginBtn: 'دخول',
      registerBtn: 'تسجيل',
      noAccount: 'ليس لديك حساب؟ ',
      haveAccount: 'لديك حساب بالفعل؟ ',
      registerNow: 'سجل الآن',
      loginNow: 'سجل دخول'
    },
    dashboard: {
      loading: 'جاري التحميل...',
      welcome: 'أهلاً بك',
      subtitle: 'مرحباً بك في لوحة التحكم الخاصة بك، بائع ازيائك وتصاميمك من هنا.',
      affiliateLink: 'رابط الإحالة الخاص بك',
      affiliateDesc: 'شارك هذا الرابط مع أصدقائك أو عملائك واحصل على 50 جنيه عن كل شراء.',
      copied: 'تم النسخ!',
      copy: 'نسخ',
      balance: 'رصيدك الحالي',
      currency: 'ع.ج',
      referred: 'العملاء المحالين',
      person: 'شخص',
      totalSales: 'المبيعات الإجمالية',
      order: 'طلبية',
      designs: 'التصاميم المنشورة',
      design: 'تصميم'
    },
    community: {
      title: 'معرض التصاميم المجتمعية',
      subtitle: 'اكتشف تصاميم المبدعين، اشترِ ما يعجبك وادعمهم',
      filterMenu: 'قائمة الفلترة',
      categories: 'التصنيفات',
      all: 'الكل',
      tshirts: 'تي شيرت (T-Shirts)',
      hoodies: 'هوديز (قريباً)',
      featuredArtists: 'أبرز المبدعين',
      allArtists: 'الجميع',
      noDesigns: 'لا توجد تصاميم مطابقة للبحث.',
      noImage: 'بدون صورة',
      designedBy: 'من تصميم: ',
      unknownArtist: 'مبدع مجهول',
      buyDesign: 'شراء التصميم'
    }
  }
};

type TranslationsType = typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    // Detect system language
    const browserLang = navigator.language || navigator.languages[0];
    if (browserLang.toLowerCase().startsWith('en')) {
      setLanguage('en');
    } else {
      setLanguage('ar'); // Default to Arabic for other languages
    }
  }, []);

  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = translations[language];
    for (const key of keys) {
      if (current[key] === undefined) {
        return path; // Return the key path if not found
      }
      current = current[key];
    }
    return current;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      <div dir={dir} className={language === 'ar' ? "font-['Cairo']" : "font-['Inter']"}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
