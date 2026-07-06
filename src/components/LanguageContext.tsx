import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextProps {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // App titles
    appName: 'SariRemit',
    appTagline: 'Expats Savings & Remittance Companion',
    appDesc: 'Maximize your hard-earned savings. Compare STC Pay, urpay, Mobily Pay, Enjaz, and more for sending money home from Saudi Arabia.',
    
    // Navigation
    navHome: 'Home',
    navCompare: 'Compare Rates',
    navSubmit: 'Submit Rate',
    navInsights: 'Corridor Insights',
    navAlerts: 'Rate Alerts',
    navProfile: 'My Profile',

    // Landing Page
    heroTitle: 'Send More Money Home, Pay Fewer Fees',
    heroSub: 'SariRemit helps expats in Saudi Arabia make confident remittance decisions through trusted intelligence on where, when, and how to send money home.',
    compareNow: 'Compare Now',
    activeExpats: 'Active Expats',
    howItWorks: 'How SariRemit Helps You',
    step1Title: '1. Enter Amount',
    step1Desc: 'Input your sending amount in Saudi Riyals (SAR).',
    step2Title: '2. Compare Channels',
    step2Desc: 'Instantly view live rates from STC Pay, urpay, banks, and Western Union.',
    step3Title: '3. Choose & Save',
    step3Desc: 'Pick the option with the highest payout and lowest transfer fees.',
    savingsCalculated: 'Average Expats save up to 180 SAR monthly by comparing channels!',
    recentCrowdsourced: 'Community Crowd-Sourced Rates',
    verified: 'Verified',
    communityContributed: 'Contributed by expats like you in the last 24 hours.',

    // Compare Calculator
    calculatorTitle: 'Remittance Intelligence Calculator',
    sendingAmount: 'Sending Amount',
    destinationCountry: 'Destination Country',
    receiveCurrency: 'Expected Receiving Currency',
    transferMethod: 'Transfer Method',
    allMethods: 'All Methods',
    bankTransfer: 'Bank Account Transfer',
    mobileWallet: 'Mobile Wallet Cashout',
    cashPickup: 'Cash Pickup Counter',
    
    // Calculator Results
    provider: 'Provider / Channel',
    rate: 'Exchange Rate',
    fee: 'Transfer Fee',
    receivedAmount: 'Recipient Receives',
    delivery: 'Delivery Speed',
    confidence: 'Confidence Score',
    lastUpdated: 'Last Updated',
    bestValue: 'Best Value Recommendation',
    bestRate: 'Highest Family Value',
    lowestFee: 'Lowest Fee',
    fastestSpeed: 'Fastest Delivery',
    actionSend: 'Send Now',
    unsupportedCorridor: 'Select your preferred country to see dynamic rates.',
    
    // Savings Insight Card
    savingsInsight: 'Savings Analysis',
    savingsCompare: 'Best vs. Worst Option',
    savingsExplain: 'By choosing the top provider instead of the lowest provider, you put more money in your family\'s pocket:',
    extraReceived: 'Extra amount received:',
    worstOption: 'Worst option pays:',
    bestOption: 'Best option pays:',
    equivalentTo: 'Equivalent to saving',
    trustScoreDesc: 'Confidence score is calculated based on recent community updates and verified official API feeds.',

    // Submit Rate
    submitTitle: 'Submit Today\'s Remittance Rate',
    submitSub: 'Saw a great rate in your app today? Share it with fellow expats to help everyone save!',
    rateSubmittedSuccessfully: 'Thank you! Your rate has been submitted to the community queue.',
    providerSelect: 'Select Provider',
    selectCountry: 'Select Destination Country',
    enterRate: 'Exchange Rate (for 1 SAR)',
    enterFee: 'Transfer Fee (SAR)',
    screenshotLabel: 'Upload Screenshot (Optional Receipt/App Screen)',
    dragAndDrop: 'Drag and drop an image, or click to browse',
    submitButton: 'Submit to Community',
    recentSubmissions: 'Recent Submissions Feed',
    submittedBy: 'Submitted by',
    verifyRate: 'Verify Rate',
    upvote: 'Upvote',

    // Corridor Insights
    insightsTitle: 'Corridor & Trends Analysis',
    insightsSub: 'Track SAR exchange rate histories and understand seasonal trends to time your transfers perfectly.',
    selectCorridor: 'Select Corridor',
    historicalRates: 'Historical Rate Trend (Last 15 Days)',
    bestTimeToTransfer: 'Optimal Timing Guidance',
    bestDayTitle: 'Best Days to Send',
    bestDayDesc: 'Historically, rates peak on Tuesdays and Wednesdays before weekend remittance rushes in Saudi Arabia.',
    averageFeeTitle: 'Average Network Fee',
    averageFeeDesc: 'Digital wallets average 8-10 SAR fee, while traditional bank queues and physical agents cost 15-20 SAR.',
    rateVolatility: 'Rate Volatility',
    lowVolatility: 'Stable Rate (Low Volatility)',
    medVolatility: 'Moderate (Keep Monitoring)',
    highVolatility: 'High (Compare before sending)',
    corridorQuickStats: 'Quick Corridor Stats',

    // Alerts
    alertsTitle: 'Remittance Rate Alerts',
    alertsSub: 'Don\'t miss out on peak rates. Set a target exchange rate, and we will notify you when providers hit that mark.',
    createAlert: 'Create New Alert',
    alertCreatedSuccess: 'Alert set! You will be notified.',
    selectProvider: 'Select Provider (or All)',
    allProviders: 'All Providers (Best Available)',
    notifyWhenRate: 'Notify me when rate is',
    above: 'Above or Equal to',
    below: 'Below or Equal to',
    targetValue: 'Target Exchange Rate',
    notificationMethod: 'Your Notification Contact (Email / Phone)',
    activeAlerts: 'Your Active Alerts',
    noAlerts: 'No alerts set yet. Create one above!',
    recentAlertTriggers: 'Recent Triggered Alerts (Simulated Demo)',

    // Profile
    profileTitle: 'My Expat Profile',
    profileSub: 'Personalize your remittance experience, track your lifetime savings, and save your target corridors.',
    personalDetails: 'Personal Details',
    savingsTracker: 'Savings Goal Tracker',
    lifetimeSavings: 'Total Saved with SariRemit',
    monthlySavingsGoal: 'Monthly Savings Target',
    favoriteCorridors: 'Favorite Destination Corridors',
    addFavorite: 'Add Favorite Corridor',
    settings: 'App Settings',
    languagePref: 'Interface Language',
    notificationPref: 'Instant SMS & Email Alerts',
    saveProfile: 'Save Profile Changes',
    profileSavedSuccess: 'Profile updated successfully!',
    expatLevel: 'Savvy Expat Level'
  },
  ar: {
    // App titles
    appName: 'ساري ريميت',
    appTagline: 'رفيق المغتربين للتوفير والتحويلات المالية',
    appDesc: 'عظّم مدخراتك التي كسبتها بجهدك. قارن بين STC Pay و urpay و Mobily Pay و Enjaz والمزيد لإرسال الأموال إلى بلدك من المملكة العربية السعودية.',
    
    // Navigation
    navHome: 'الرئيسية',
    navCompare: 'مقارنة الأسعار',
    navSubmit: 'إرسال سعر اليوم',
    navInsights: 'تحليلات المسارات',
    navAlerts: 'تنبيهات الأسعار',
    navProfile: 'ملفي الشخصي',

    // Landing Page
    heroTitle: 'أرسل أموالاً أكثر لبلدك، وادفع رسوماً أقل',
    heroSub: 'ساري ريميت يساعد المغتربين في المملكة العربية السعودية على اتخاذ قرارات تحويل واثقة من خلال معلومات موثوقة حول مكان ووقت وكيفية إرسال الأموال إلى بلدانهم.',
    compareNow: 'قارن الآن',
    activeExpats: 'المغتربين النشطين',
    howItWorks: 'كيف يساعدك ساري ريميت',
    step1Title: '١. أدخل المبلغ',
    step1Desc: 'أدخل قيمة المبلغ المرسل بالريال السعودي (SAR).',
    step2Title: '٢. قارن القنوات',
    step2Desc: 'اعرض فوراً الأسعار المباشرة من STC Pay و urpay والبنوك و Western Union.',
    step3Title: '٣. اختر ووفر',
    step3Desc: 'اختر العرض الأعلى قيمة والأقل في رسوم التحويل.',
    savingsCalculated: 'يوفر المغتربون بالمتوسط ما يصل إلى ١٨٠ ريال شهرياً بمقارنة القنوات!',
    recentCrowdsourced: 'أسعار مضافة من المجتمع اليوم',
    verified: 'موثق',
    communityContributed: 'مساهمات من مغتربين مثلك خلال الـ ٢٤ ساعة الماضية.',

    // Compare Calculator
    calculatorTitle: 'حاسبة استخبارات التحويلات المالية',
    sendingAmount: 'المبلغ المرسل',
    destinationCountry: 'بلد الوجهة',
    receiveCurrency: 'العملة المتوقعة للمستلم',
    transferMethod: 'طريقة التحويل',
    allMethods: 'جميع الطرق',
    bankTransfer: 'تحويل لحساب بنكي',
    mobileWallet: 'سحب محفظة الجوال',
    cashPickup: 'استلام نقدي من الفرع',
    
    // Calculator Results
    provider: 'مزود الخدمة / القناة',
    rate: 'سعر الصرف',
    fee: 'رسوم التحويل',
    receivedAmount: 'المستلم يحصل على',
    delivery: 'سرعة الوصول',
    confidence: 'مستوى الموثوقية',
    lastUpdated: 'آخر تحديث',
    bestValue: 'أفضل قيمة موصى بها',
    bestRate: 'أعلى قيمة للعائلة',
    lowestFee: 'أقل رسوم',
    fastestSpeed: 'الأسرع وصولاً',
    actionSend: 'أرسل الآن',
    unsupportedCorridor: 'يرجى اختيار بلدك المفضل لمشاهدة الأسعار التفاعلية.',
    
    // Savings Insight Card
    savingsInsight: 'تحليل التوفير',
    savingsCompare: 'أفضل خيار مقابل أسوأ خيار',
    savingsExplain: 'باختيارك للمزود الأفضل بدلاً من المزود الأقل سعراً، ستضع المزيد من الأموال في جيب عائلتك:',
    extraReceived: 'المبلغ الإضافي المستلم:',
    worstOption: 'الخيار الأسوأ يدفع:',
    bestOption: 'الخيار الأفضل يدفع:',
    equivalentTo: 'ما يعادل توفير',
    trustScoreDesc: 'يتم احتساب درجة الموثوقية بناءً على تحديثات المجتمع الأخيرة ومصادر الأسعار الرسمية الموثقة.',

    // Submit Rate
    submitTitle: 'أرسل سعر الصرف اليوم',
    submitSub: 'هل شاهدت سعر صرف ممتاز في تطبيقك اليوم؟ شاركه مع زملائك المغتربين لمساعدة الجميع على التوفير!',
    rateSubmittedSuccessfully: 'شكراً لك! تم إرسال سعرك إلى قائمة مراجعة المجتمع.',
    providerSelect: 'اختر مزود الخدمة',
    selectCountry: 'اختر بلد الوجهة',
    enterRate: 'سعر الصرف (لكل ١ ريال سعودي)',
    enterFee: 'رسوم التحويل (ريال)',
    screenshotLabel: 'ارفع صورة الشاشة (إيصال أو شاشة التطبيق - اختياري)',
    dragAndDrop: 'اسحب وأسقط الصورة هنا، أو اضغط للتصفح',
    submitButton: 'إرسال للمجتمع',
    recentSubmissions: 'آخر مشاركات المجتمع',
    submittedBy: 'مرسل بواسطة',
    verifyRate: 'توثيق السعر',
    upvote: 'تصويت مؤيد',

    // Corridor Insights
    insightsTitle: 'تحليل المسارات والاتجاهات',
    insightsSub: 'تتبع تاريخ أسعار صرف الريال السعودي وتعرف على الاتجاهات الموسمية لتوقيت تحويلاتك بشكل مثالي.',
    selectCorridor: 'اختر المسار',
    historicalRates: 'اتجاه سعر الصرف التاريخي (آخر ١٥ يوماً)',
    bestTimeToTransfer: 'توجيهات التوقيت الأمثل',
    bestDayTitle: 'أفضل الأيام للإرسال',
    bestDayDesc: 'تاريخياً، تصل الأسعار إلى ذروتها يومي الثلاثاء والأربعاء قبل عطلة نهاية الأسبوع في السعودية.',
    averageFeeTitle: 'متوسط رسوم الشبكة',
    averageFeeDesc: 'تتراوح رسوم المحافظ الرقمية بين ٨-١٠ ريالات بالمتوسط، بينما تكلف البنوك والوكلاء التقليديون ١٥-٢٠ ريالاً.',
    rateVolatility: 'تذبذب السعر',
    lowVolatility: 'سعر مستقر (تذبذب منخفض)',
    medVolatility: 'متوسط (تابع المراقبة)',
    highVolatility: 'مرتفع (قارن قبل الإرسال)',
    corridorQuickStats: 'إحصاءات سريعة للمسار',

    // Alerts
    alertsTitle: 'تنبيهات أسعار التحويل',
    alertsSub: 'لا تفوت فرصة الأسعار المرتفعة. حدد سعر الصرف المستهدف، وسنقوم بإعلامك عندما يصل أي مزود إلى هذا السعر.',
    createAlert: 'إنشاء تنبيه جديد',
    alertCreatedSuccess: 'تم ضبط التنبيه! سنقوم بإخطارك.',
    selectProvider: 'اختر مزود الخدمة (أو الجميع)',
    allProviders: 'جميع المزودين (أفضل سعر متاح)',
    notifyWhenRate: 'أعلمني عندما يكون السعر',
    above: 'أعلى من أو يساوي',
    below: 'أقل من أو يساوي',
    targetValue: 'سعر الصرف المستهدف',
    notificationMethod: 'وسيلة الاتصال للتنبيه (البريد الإلكتروني / الهاتف)',
    activeAlerts: 'تنبيهاتك النشطة',
    noAlerts: 'لم تقم بضبط أي تنبيهات حتى الآن. أنشئ تنبيهاً أعلاه!',
    recentAlertTriggers: 'التنبيهات الأخيرة المفعلة (تجريبية)',

    // Profile
    profileTitle: 'ملفي الشخصي كمغترب',
    profileSub: 'خصص تجربة التحويل المالي الخاصة بك، وتتبع مدخراتك مدى الحياة، واحفظ مساراتك المفضلة.',
    personalDetails: 'التفاصيل الشخصية',
    savingsTracker: 'متابع هدف التوفير',
    lifetimeSavings: 'إجمالي التوفير مع ساري ريميت',
    monthlySavingsGoal: 'هدف التوفير الشهري',
    favoriteCorridors: 'مسارات الوجهة المفضلة',
    addFavorite: 'إضافة مسار مفضل',
    settings: 'إعدادات التطبيق',
    languagePref: 'لغة الواجهة',
    notificationPref: 'التنبيهات الفورية عبر الرسائل والبريد',
    saveProfile: 'حفظ تغييرات الملف الشخصي',
    profileSavedSuccess: 'تم تحديث الملف الشخصي بنجاح!',
    expatLevel: 'مستوى المغترب الذكي'
  }
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Read from localStorage if available
    const saved = localStorage.getItem('sariremit_lang') as Language;
    if (saved === 'en' || saved === 'ar') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sariremit_lang', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const isRtl = language === 'ar';

  useEffect(() => {
    // Set document direction
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRtl]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t, isRtl }}>
      {children}
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
