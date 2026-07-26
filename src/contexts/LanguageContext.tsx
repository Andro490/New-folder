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
      loginNow: 'Login Now',
      loginErrorGoogle: 'Google login failed. Please try again.',
      checkEmail: '📨 Check your email',
      otpSentTo: 'We sent a verification code to ',
      loginSubtitle: 'Enter your details to login directly',
      registerSubtitle: 'We will send a verification code to your email to confirm registration',
      sendOtpBtn: '📩 Send Verification Code',
      loggingIn: 'Logging in...',
      sending: 'Sending...',
      enterFullOtp: 'Please enter the full 6-digit code',
      verifyBtn: '✅ Confirm Code',
      verifying: 'Verifying...',
      resendAfter: 'Resend after',
      sec: 's',
      resendOtpBtn: '🔄 Resend Code',
      changeEmail: '← Change Email',
      or: 'Or',
      googleContinue: 'Continue with Google'
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
    },
    orderModal: {
      thanksTitle: 'Thank You! 🎉',
      orderConfirmedMsg: 'Your order has been received successfully.\nOur team will contact you within ',
      orderConfirmedMsg2: '24 hours',
      orderConfirmedMsg3: ' to confirm the design.\nStay tuned for your custom t-shirt! 🔥',
      backToDesign: 'Back to Design',
      size: 'Size',
      color: 'Color',
      total: 'Total',
      checkoutTitle: 'Checkout',
      deliveryInfo: 'Delivery Info',
      firstName: 'First Name',
      lastName: 'Last Name',
      phone: 'Phone Number',
      phoneError: '⚠ Number must start with 01',
      phoneValid: '✓ Valid Number',
      phoneRemaining: ' digits remaining',
      city: 'City',
      governorate: 'Governorate',
      address: 'Address',
      shipping: 'Shipping',
      payment: 'Payment Method',
      attachProof: '📎 Attach Transfer Receipt',
      chooseProof: '+ Choose Receipt Image',
      proofSuccess: '✓ Receipt uploaded successfully',
      yourDesign: 'Your Design',
      front: 'Front',
      back: 'Back',
      orderSummary: 'Order Summary',
      product: 'Product',
      tshirt: 'T-Shirt',
      fit: 'Fit',
      designLink: 'Design Link',
      noLink: 'No Link',
      submitOrder: 'Complete Order ✓',
      submitting: '⏳ Submitting Order...',
      contactUs: 'Contact Us',
      refundPolicy: 'Refund Policy',
      fillRequired: 'Please fill out your name, phone number, and address',
      phoneMustBe11: 'Phone number must be 11 digits and start with 01',
      instapayProofReq: 'Please upload the InstaPay transfer receipt',
      step2of2: 'STEP 2 OF 2',
      reviewOrder: 'REVIEW ORDER',
      changeSize: '← CHANGE SIZE',
      designPreview: 'DESIGN PREVIEW',
      configuration: 'CONFIGURATION',
      confirmOrder: 'CONFIRM ORDER',
      step1of2: 'STEP 1 OF 2',
      selectSize: 'SELECT SIZE',
      perfectFit: 'PERFECT YOUR FIT',
      knowYourSize: 'Know Your Size',
      freeShipping: 'Free Shipping',
      freeShippingSub: 'Available only in Aswan',
      premiumShipping: 'Premium Shipping in Egypt',
      premiumShippingSub: 'Delivery within 7 working days',
      instapay: 'InstaPay',
      cod: 'Cash on Delivery',
      codSub: 'A 20% deposit of the total price is required',
      discount: 'Discount',
      refundPolicyTitle: 'Refund Policy',
      refundPolicyText: 'Unfortunately, we do not offer return or exchange services because this t-shirt is custom designed for you. However, you can refuse to receive the order if the design is not as you designed or requested, or if you are not satisfied with the material.',
      gotIt: 'Got It',
      sendTo: 'Send to: '
    },
    editor: {
      settings: 'Settings',
      product: 'Product',
      tshirt: 'T-Shirt',
      fit: 'Fit',
      regularFit: 'Regular Fit',
      color: 'Color',
      black: 'Black',
      white: 'White',
      navy: 'Navy',
      red: 'Red',
      gray: 'Gray',
      completeOrder: 'Complete Order',
      designTools: 'Design Tools',
      uploadImage: 'Upload image from device',
      addPinterest: 'Add from Pinterest',
      addText: 'Add Text',
      designPreview: 'Design Size Preview',
      zoomOut: 'Zoom Out',
      zoomIn: 'Zoom In',
      saveChanges: 'Save changes for later',
      loginFirst: '⚠️ Please login first',
      publishSale: 'Publish Design for Sale 💸'
    },
    sizeGuide: {
      title: 'PrintStudio Smart Size Guide',
      subtitle: 'Measure carefully:',
      regularFitTitle: 'Regular Fit',
      regularFitDesc: 'Regular cut, shoulders aligned, true to size.',
      boxyFitTitle: 'Boxy Fit',
      boxyFitDesc: 'Boxy cut, relaxed shoulders, fits true to your size.',
      howToMeasure: 'How to measure',
      suggestedSize: 'Suggested Size',
      inCm: '(in cm)',
      shoulderWidth: 'Shoulder Width',
      shoulder: 'Shoulder',
      chestWidth: 'Chest Circumference',
      chest: 'Chest',
      tshirtLength: 'T-Shirt Length',
      smartCalcTitle: 'Smart Size Calculator',
      example: 'Example:',
      regularFitSuggested: 'Regular Fit suggested based on your measurements',
      footerNote1: '* Measure correctly to get the right fit.',
      footerNote2: '* Measurement variations are indicated for different models.'
    },
    publishModal: {
      publishDesign: 'Publish Design',
      designName: 'Design Name',
      enterUniqueName: 'Enter a unique name for your design',
      exampleName: 'Example: Spider Street T-Shirt',
      bgCardOptional: 'Design Card Background (Optional)',
      none: 'None',
      color: '🎨 Color',
      image: '🖼️ Image',
      chooseColor: 'Choose Color',
      uploadBgImage: '📷 Upload Background Image',
      change: 'Change',
      cancel: 'Cancel',
      publishNow: 'Publish Now',
      uploading: 'Uploading...'
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
      noAccount: 'مش عندك حساب؟ ',
      haveAccount: 'عندك حساب؟ ',
      registerNow: 'سجل الآن',
      loginNow: 'سجل دخول',
      loginErrorGoogle: 'فشل تسجيل الدخول بحساب جوجل. حاول مرة أخرى.',
      checkEmail: '📨 تحقق من بريدك',
      otpSentTo: 'أرسلنا كود التحقق إلى ',
      loginSubtitle: 'أدخل بياناتك لتسجيل الدخول مباشرة',
      registerSubtitle: 'سنرسل كود تحقق على بريدك لتأكيد التسجيل',
      sendOtpBtn: '📩 إرسال كود التحقق',
      loggingIn: 'جاري تسجيل الدخول...',
      sending: 'جاري الإرسال...',
      enterFullOtp: 'أدخل الكود كاملاً (6 أرقام)',
      verifyBtn: '✅ تأكيد الكود',
      verifying: 'جاري التحقق...',
      resendAfter: 'إعادة الإرسال بعد ',
      sec: 'ث',
      resendOtpBtn: '🔄 إعادة إرسال الكود',
      changeEmail: '← تغيير البريد الإلكتروني',
      or: 'أو',
      googleContinue: 'متابعة بحساب جوجل'
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
    },
    orderModal: {
      thanksTitle: 'شكراً لك! 🎉',
      orderConfirmedMsg: 'تم استلام طلبك بنجاح.\nسيتواصل معك فريقنا خلال ',
      orderConfirmedMsg2: '24 ساعة',
      orderConfirmedMsg3: ' لتأكيد التصميم.\nترقّب تيشيرتك المخصص! 🔥',
      backToDesign: 'العودة للتصميم',
      size: 'المقاس',
      color: 'اللون',
      total: 'الإجمالي',
      checkoutTitle: 'الدفع',
      deliveryInfo: 'معلومات التوصيل',
      firstName: 'الاسم الأول',
      lastName: 'اسم العائلة',
      phone: 'رقم الهاتف',
      phoneError: '⚠ يجب أن يبدأ الرقم بـ 01',
      phoneValid: '✓ رقم صحيح',
      phoneRemaining: ' أرقام متبقية',
      city: 'مدينة',
      governorate: 'محافظة',
      address: 'عنوان',
      shipping: 'شحن',
      payment: 'طريقة الدفع',
      attachProof: '📎 إرفاق إيصال التحويل',
      chooseProof: '+ اختر صورة التحويل',
      proofSuccess: '✓ تم رفع الإيصال بنجاح',
      yourDesign: 'تصميمك',
      front: 'أمام',
      back: 'خلف',
      orderSummary: 'ملخص الطلب',
      product: 'منتج',
      tshirt: 'تي شيرت',
      fit: 'ملائم',
      designLink: 'رابط التصميم',
      noLink: 'لا يوجد رابط',
      submitOrder: 'إتمام الطلب ✓',
      submitting: '⏳ جاري إرسال الطلب...',
      contactUs: 'اتصل بنا',
      refundPolicy: 'سياسة الاسترداد',
      fillRequired: 'يرجى ملء الاسم ورقم الهاتف والعنوان',
      phoneMustBe11: 'رقم الهاتف يجب أن يكون 11 رقم ويبدأ بـ 01',
      instapayProofReq: 'يرجى رفع صورة إيصال التحويل عبر إنستاباي',
      step2of2: 'الخطوة 2 من 2',
      reviewOrder: 'مراجعة الطلب',
      changeSize: '← تغيير المقاس',
      designPreview: 'معاينة التصميم',
      configuration: 'التفاصيل',
      confirmOrder: 'تأكيد الطلب',
      step1of2: 'الخطوة 1 من 2',
      selectSize: 'اختر المقاس',
      perfectFit: 'المقاس المناسب لك',
      knowYourSize: 'اعرف مقاسك',
      freeShipping: 'اشحن مجانًا',
      freeShippingSub: 'متوفر داخل اسوان',
      premiumShipping: 'خدمة الترحيل في مصر',
      premiumShippingSub: 'يتم التوصيل خلال 7 أيام عمل',
      instapay: 'إنستاباي',
      cod: 'الدفع عند الاستلام',
      codSub: 'سيُطلب دفع عربون بنسبة 20% من السعر الإجمالي',
      discount: 'خصم',
      refundPolicyTitle: 'سياسة الاسترداد',
      refundPolicyText: 'للأسف، لا نقدم خدمة الإرجاع أو الاستبدال لأن هذا التيشيرت مصمم خصيصاً لك. مع ذلك، يمكنك رفض استلام الطلب إذا لم يكن التصميم كما صممته أو طلبته، أو إذا لم تكن راضياً عن الخامة.',
      gotIt: 'فهمتها',
      sendTo: 'أرسل إلى: '
    },
    editor: {
      settings: 'إعدادات',
      product: 'منتج',
      tshirt: 'تي شيرت',
      fit: 'ملائم',
      regularFit: 'مقاس عادي',
      color: 'لون',
      black: 'أسود',
      white: 'أبيض',
      navy: 'كحلي',
      red: 'أحمر',
      gray: 'رمادي',
      completeOrder: 'إتمام الطلب',
      designTools: 'أدوات التصميم',
      uploadImage: 'رفع صورة من الجهاز',
      addPinterest: 'إضافة من Pinterest',
      addText: 'إضافة نص (عربي/إنجليزي)',
      designPreview: 'معاينة حجم التصميم',
      zoomOut: 'تصغير',
      zoomIn: 'تكبير',
      saveChanges: 'حفظ التعديلات للعودة لاحقاً',
      loginFirst: '⚠️ يرجى تسجيل الدخول أولاً',
      publishSale: 'نشر التصميم للبيع 💸'
    },
    sizeGuide: {
      title: 'دليل المقاسات الذكية لـ PrintStudio',
      subtitle: 'على القيش شينشين:',
      regularFitTitle: 'مقاس عادي',
      regularFitDesc: 'قصة منتظمة، التوجيه على الكتف، القيادة على قياساتك.',
      boxyFitTitle: 'قصة مربعة',
      boxyFitDesc: 'قصة Boxy Fit، التوجيه على الرئيس، على قياسك.',
      howToMeasure: 'كيفية القياس',
      suggestedSize: 'المقاس المقترح',
      inCm: '(بالسنتيمتر)',
      shoulderWidth: 'عرض الكتفين',
      shoulder: 'عرض الكتف',
      chestWidth: 'محيط الصدر',
      chest: 'محيط الصدر',
      tshirtLength: 'طول التيشيرت',
      smartCalcTitle: 'حساب مقاسي الذكي',
      example: 'مثال:',
      regularFitSuggested: 'قصة Regular Fit، بناءً على قياساتك',
      footerNote1: '* كيفية القياس الصحيح لك للحصول على القياس المناسب.',
      footerNote2: '* تتم الإشارة إلى تباين القياس لنماذج مختلفة.'
    },
    publishModal: {
      publishDesign: 'نشر التصميم',
      designName: 'اسم التصميم',
      enterUniqueName: 'أدخل اسماً مميزاً لتصميمك',
      exampleName: 'مثال: Spider Street تيشيرت',
      bgCardOptional: 'خلفية بطاقة التصميم (اختياري)',
      none: 'بدون',
      color: '🎨 لون',
      image: '🖼️ صورة',
      chooseColor: 'اختر لون',
      uploadBgImage: '📷 ارفع صورة خلفية',
      change: 'تغيير',
      cancel: 'إلغاء',
      publishNow: 'نشر الآن',
      uploading: 'جاري الرفع...'
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
