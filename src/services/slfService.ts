/**
 * SariRemit Language Framework (SLF)
 * 
 * Governs communication across the entire SariRemit platform.
 * Ensures sophisticated internal intelligence (SIC, TCE, RRE, SIS) 
 * translates into simple, friendly, supportive, and Grade 6-8 level terms
 * for ordinary expatriates and migrant workers in Saudi Arabia.
 * 
 * SLF rule:
 * - Internal / developer names: SIS, RRE, SIC, TCE, Algorithm, etc.
 * - External / user-facing names: Confidence Rating, Current Verified Rate,
 *   Total Cost, Recommended Today, Today's Market Rate, etc.
 */

export interface SlfMessageParams {
  [key: string]: string | number;
}

export const SLF_DICTIONARY = {
  en: {
    // Brand & Tagline
    appName: "SariRemit",
    tagline: "Expats' Remittance Savings Assistant",
    landingDesc: "SariRemit helps migrant workers and expats in Saudi Arabia maximize savings by comparing live remittance channels and exchange rates. Avoid high fees and bad rates.",
    
    // Core Navigation & Tabs
    compareRates: "Compare Providers",
    compareRatesDesc: "Find the best exchange rate and lowest transfer fees from Saudi Arabia to your home country.",
    submitRate: "Submit Today's Rate",
    submitRateDesc: "Help other expats by sharing today's rate from your mobile apps.",
    corridorInsights: "Money Savings Guide",
    alerts: "Rate Alerts",
    profile: "My Profile",
    bestValue: "Best Option Today",
    savingsHigh: "MAXIMUM SAVINGS",
    chooseCountry: "Select Destination Country",
    sendingAmount: "Sending Amount (SAR)",
    receivingCurrency: "Receive Currency",
    provider: "Provider / Wallet",
    transferMethod: "Transfer Method",
    allMethods: "All Methods",
    bankTransfer: "Bank Transfer",
    cashPickup: "Cash Pickup",
    mobileWallet: "Mobile Wallet / App",
    exchangeRate: "Exchange Rate",
    transferFee: "Transfer Fee",
    estReceived: "Est. Amount Received",
    deliverySpeed: "Delivery Speed",
    confidenceScore: "Confidence Rating",
    lastUpdated: "Updated Recently",
    
    // Onboarding Screen
    onboardingTitle: "Welcome to SariRemit",
    onboardingDesc: "Let's set up your profile so we can help you find the best way to send money home.",
    onboardingStep1: "Compare trusted providers.",
    onboardingStep2: "See how much your family will receive.",
    onboardingStep3: "Understand the total cost.",
    onboardingStep4: "Know when it's a good time to send.",
    onboardingStep5: "Track how much you save.",
    
    // UI Elements / Buttons (No technical jargon)
    btnCompare: "Compare Providers",
    btnBestOption: "Best Option Today",
    btnSeeDetails: "See Details",
    btnTrackSavings: "Track My Savings",
    btnNotifyMe: "Notify Me",
    btnWhyThisOption: "Why This Option?",
    btnSendSmarter: "Send Smarter",
    btnCreateAlert: "Create Live Alert",
    btnGetStarted: "Compare & Save Now",
    btnSaveNow: "Compare Rates",
    btnBackHome: "Back to Home",
    btnAddAlert: "Add New Alert",
    btnVerifyRate: "Verify This Rate",
    btnSubmitManual: "Manual Contribution",
    btnUploadScreenshot: "Upload Screenshot",
    
    // Confidence and Verification Status (Words over numbers)
    confidenceHigh: "Excellent (Verified by other expats)",
    confidenceMedium: "Good (Updated recently)",
    confidenceLow: "Limited (Unverified today)",
    verifiedByExpats: "Verified by Other Expats",
    verifiedManual: "Verified Manual Update",
    verifiedSource: "Verified Source",
    
    // True Cost Definitions (Total Cost, Exchange Rate Difference)
    trueCostTitle: "What You'll Really Pay",
    trueCostDesc: "Includes fees and the effect of the exchange rate difference.",
    exchangeRateLossLabel: "Exchange Rate Difference",
    extraCostLabel: "Extra Cost from the Exchange Rate",
    todayMarketRate: "Today's Market Rate",
    
    // Insights
    insightVolatility: "Rates changed slightly today.",
    insightNoAdvantage: "No clear advantage today.",
    insightPositiveTrend: "Rates look slightly better today.",
    trendUp: "Rates look slightly better today. Good time to send!",
    trendDown: "Rates changed slightly. Consider waiting if not urgent.",
    savingsInsightTitle: "Community Savings Guide",
    savingsInsightDesc: "By selecting the best provider instead of the worst, you save money that goes directly to your family.",
    
    // Alerts
    alertTargetReached: "Your target rate is now available.",
    alertTriggerActivated: "Good news! Your preferred rate is available.",
    activeAlerts: "Your Active Alerts",
    noAlerts: "Create a rate alert and we'll notify you when rates improve.",
    
    // Errors
    errorApiFailed: "We couldn't refresh the latest rates. Please try again.",
    errorNetworkTimeout: "Connection lost. Check your internet and try again.",
    errorUnknown: "Something went wrong. Please try again.",
    
    // Empty States
    emptyTransfers: "You haven't made any transfers yet.",
    emptyAlerts: "Create a rate alert and we'll notify you when rates improve.",
    
    // Success Messages
    successRateSubmitted: "Your rate has been submitted. Thank you for helping other expats.",
    successTransferSaved: "Transfer saved successfully.",
    successSavingsUpdated: "Savings updated.",
    successProfileUpdated: "Profile updated.",
    
    // Stats & Info
    quickStats: "Live Statistics",
    activeUsers: "Active Expats This Week",
    totalSaved: "Est. Expat Money Saved",
    verifiedToday: "Rates Verified Today",
    disclaimer: "SariRemit is not an exchange service. We help expats compare and optimize rates. The numbers listed are approximate averages and may fluctuate. Always confirm rates inside your provider's wallet before executing money transfers.",
    
    // Tooltips
    tooltipConfidence: "This shows how confident we are in today's recommendation.",
    tooltipTotalCost: "This includes fees and the effect of the exchange rate.",
    tooltipUpdatedRecently: "This information was verified recently."
  },
  ar: {
    // Brand & Tagline
    appName: "ساري ريميت",
    tagline: "مساعد التوفير في تحويل الأموال للمغتربين",
    landingDesc: "يساعد ساري ريميت العمال الوافدين والمغتربين في المملكة العربية السعودية على تحقيق أقصى قدر من التوفير من خلال مقارنة قنوات التحويل وأسعار الصرف الفورية. تجنب الرسوم المرتفعة والأسعار السيئة.",
    
    // Core Navigation & Tabs
    compareRates: "قارن بين مزودي الخدمة",
    compareRatesDesc: "ابحث عن أفضل سعر صرف وأقل رسوم تحويل من المملكة العربية السعودية إلى بلدك الأم.",
    submitRate: "مشاركة سعر اليوم",
    submitRateDesc: "ساعد المغتربين الآخرين من خلال مشاركة أسعار اليوم من تطبيقات الجوال الخاصة بك.",
    corridorInsights: "دليل توفير الأموال",
    alerts: "تنبيهات الأسعار",
    profile: "ملفي الشخصي",
    bestValue: "الخيار الأفضل اليوم",
    savingsHigh: "أقصى توفير",
    chooseCountry: "اختر بلد الوجهة",
    sendingAmount: "مبلغ الإرسال (ريال سعودي)",
    receivingCurrency: "عملة الاستلام",
    provider: "مزود الخدمة / المحفظة",
    transferMethod: "طريقة التحويل",
    allMethods: "جميع الطرق",
    bankTransfer: "تحويل بنكي",
    cashPickup: "استلام نقدي",
    mobileWallet: "محفظة رقمية / تطبيق",
    exchangeRate: "سعر الصرف",
    transferFee: "رسوم التحويل",
    estReceived: "المبلغ المقدر المستلم",
    deliverySpeed: "سرعة الوصول",
    confidenceScore: "تقييم الثقة",
    lastUpdated: "تم تحديثه مؤخراً",
    
    // Onboarding Screen
    onboardingTitle: "مرحباً بك في ساري ريميت",
    onboardingDesc: "دعنا نقوم بإعداد ملفك الشخصي لنساعدك في العثور على أفضل طريقة لإرسال الأموال إلى بلدك.",
    onboardingStep1: "قارن بين مزودي الخدمة الموثوقين.",
    onboardingStep2: "شاهد كم ستستلم عائلتك.",
    onboardingStep3: "افهم التكلفة الإجمالية.",
    onboardingStep4: "اعرف الوقت المناسب للإرسال.",
    onboardingStep5: "تتبع قيمة المبالغ التي توفرها.",
    
    // UI Elements / Buttons
    btnCompare: "قارن بين مزودي الخدمة",
    btnBestOption: "الخيار الأفضل اليوم",
    btnSeeDetails: "عرض التفاصيل",
    btnTrackSavings: "تتبع توفيري",
    btnNotifyMe: "نبّهني",
    btnWhyThisOption: "لماذا هذا الخيار؟",
    btnSendSmarter: "أرسل بذكاء",
    btnCreateAlert: "إنشاء تنبيه فوري",
    btnGetStarted: "قارن ووفر الآن",
    btnSaveNow: "قارن الأسعار",
    btnBackHome: "العودة للرئيسية",
    btnAddAlert: "إضافة تنبيه جديد",
    btnVerifyRate: "تأكيد هذا السعر",
    btnSubmitManual: "إضافة يدوية للأسعار",
    btnUploadScreenshot: "تحميل لقطة الشاشة",
    
    // Confidence and Verification Status
    confidenceHigh: "ممتاز (تم التحقق من قبل مغتربين آخرين)",
    confidenceMedium: "جيد (تم التحديث مؤخراً)",
    confidenceLow: "محدود (غير مؤكد اليوم)",
    verifiedByExpats: "مؤكد من قبل مغتربين آخرين",
    verifiedManual: "تحديث يدوي معتمد",
    verifiedSource: "مصدر مؤكد",
    
    // True Cost Definitions
    trueCostTitle: "ما ستدفعه فعلياً",
    trueCostDesc: "يشمل ذلك الرسوم وتأثير فرق سعر الصرف.",
    exchangeRateLossLabel: "فرق سعر الصرف",
    extraCostLabel: "تكلفة إضافية من سعر الصرف",
    todayMarketRate: "سعر السوق اليوم",
    
    // Insights
    insightVolatility: "تغيرت الأسعار قليلاً اليوم.",
    insightNoAdvantage: "لا يوجد ميزة واضحة اليوم.",
    insightPositiveTrend: "تبدو الأسعار أفضل قليلاً اليوم.",
    trendUp: "تبدو الأسعار أفضل قليلاً اليوم. وقت مناسب للإرسال!",
    trendDown: "تغيرت الأسعار قليلاً اليوم. فكر في الانتظار إذا لم يكن الأمر عاجلاً.",
    savingsInsightTitle: "دليل توفير المجتمع",
    savingsInsightDesc: "من خلال اختيار أفضل مزود خدمة بدلاً من الأسوأ، فإنك توفر أموالاً تذهب مباشرةً إلى عائلتك.",
    
    // Alerts
    alertTargetReached: "سعر الصرف المستهدف متاح الآن.",
    alertTriggerActivated: "بشرى سارة! سعر الصرف المفضل لديك متاح الآن.",
    activeAlerts: "تنبيهاتك النشطة",
    noAlerts: "أنشئ تنبيهاً للأسعار وسنقوم بإعلامك عندما تتحسن الأسعار.",
    
    // Errors
    errorApiFailed: "لم نتمكن من تحديث أحدث الأسعار. يرجى المحاولة مرة أخرى.",
    errorNetworkTimeout: "انقطع الاتصال. تحقق من اتصالك بالإنترنت وحاول مجدداً.",
    errorUnknown: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    
    // Empty States
    emptyTransfers: "لم تقم بأي عمليات تحويل بعد.",
    emptyAlerts: "أنشئ تنبيهاً للأسعار وسنقوم بإعلامك عندما تتحسن الأسعار.",
    
    // Success Messages
    successRateSubmitted: "تم إرسال سعر الصرف الخاص بك. شكراً لك على مساعدة المغتربين الآخرين.",
    successTransferSaved: "تم حفظ التحويل بنجاح.",
    successSavingsUpdated: "تم تحديث التوفير.",
    successProfileUpdated: "تم تحديث الملف الشخصي.",
    
    // Stats & Info
    quickStats: "الإحصاءات الفورية",
    activeUsers: "المغتربون النشطون هذا الأسبوع",
    totalSaved: "إجمالي المبالغ التي وفرها المغتربون",
    verifiedToday: "الأسعار التي تم التحقق منها اليوم",
    disclaimer: "ساري ريميت ليس شركة صرافة أو تحويل أموال. نحن نساعد المغتربين على مقارنة الأسعار وتحسين التوفير. الأرقام المعروضة هي متوسطات تقديرية وقد تتغير. يرجى دائماً التأكد من الأسعار داخل تطبيق المزود الرسمي قبل التحويل.",
    
    // Tooltips
    tooltipConfidence: "يوضح هذا مدى ثقتنا في توصية اليوم.",
    tooltipTotalCost: "يشمل ذلك الرسوم وتأثير سعر الصرف.",
    tooltipUpdatedRecently: "تم التحقق من هذه المعلومات مؤخراً."
  }
};

/**
 * SariRemit Language Framework API
 */
export const slf = {
  /**
   * Translates a key to the desired language with optional parameter interpolation
   */
  t: (key: keyof typeof SLF_DICTIONARY.en, lang: 'en' | 'ar', params?: SlfMessageParams): string => {
    const dict = SLF_DICTIONARY[lang] || SLF_DICTIONARY.en;
    let text = dict[key] || SLF_DICTIONARY.en[key] || '';
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }
    return text;
  },

  /**
   * Standardizes the user-friendly words for any level on a 0-100 scale or name representation
   */
  formatConfidence: (score: number, lang: 'en' | 'ar'): string => {
    let word = "";
    if (score >= 90) {
      word = lang === 'en' ? "Excellent" : "ممتاز";
    } else if (score >= 80) {
      word = lang === 'en' ? "Very High" : "مرتفع جداً";
    } else if (score >= 70) {
      word = lang === 'en' ? "High" : "مرتفع";
    } else if (score >= 60) {
      word = lang === 'en' ? "Good" : "جيد";
    } else if (score >= 45) {
      word = lang === 'en' ? "Fair" : "مقبول";
    } else if (score >= 30) {
      word = lang === 'en' ? "Limited" : "محدود";
    } else {
      word = lang === 'en' ? "Low" : "منخفض";
    }
    return `${score} - ${word}`;
  },

  /**
   * Explains comparison and potential savings using simple Grade 6-8 friendly language
   */
  formatRecommendationReason: (params: {
    recommendedProvider: string;
    targetProvider?: string;
    savingsAmount: number;
    currencyCode: string;
    sarEquivalent: number;
    lang: 'en' | 'ar';
  }): string => {
    const { recommendedProvider, targetProvider, savingsAmount, currencyCode, sarEquivalent, lang } = params;
    
    if (lang === 'en') {
      if (targetProvider && targetProvider !== recommendedProvider) {
        return `We recommend sending via ${recommendedProvider} instead of ${targetProvider}. This simple choice saves you about ${savingsAmount.toFixed(1)} ${currencyCode} (~${sarEquivalent.toFixed(1)} SAR) in fees and exchange rate differences today!`;
      }
      return `${recommendedProvider} offers the best value today with the highest estimated payout for your family and the lowest total cost.`;
    } else {
      if (targetProvider && targetProvider !== recommendedProvider) {
        return `نوصي بالإرسال عبر ${recommendedProvider} بدلاً من ${targetProvider}. هذا الاختيار البسيط يوفر لك حوالي ${savingsAmount.toFixed(1)} ${currencyCode} (أي ما يعادل ~${sarEquivalent.toFixed(1)} ريال سعودي) من الرسوم وفروقات أسعار الصرف اليوم!`;
      }
      return `يقدم ${recommendedProvider} أفضل قيمة اليوم مع أعلى مبلغ مستلم لعائلتك وأقل تكلفة إجمالية.`;
    }
  },

  /**
   * Returns a simple human-friendly description for any error condition, bypassing technical codes.
   */
  formatError: (type: 'api' | 'network' | 'timeout' | 'generic', lang: 'en' | 'ar'): string => {
    if (type === 'network' || type === 'timeout') {
      return lang === 'en' 
        ? "Connection lost. Check your internet and try again." 
        : "انقطع الاتصال. تحقق من اتصالك بالإنترنت وحاول مجدداً.";
    }
    if (type === 'api') {
      return lang === 'en'
        ? "We couldn't refresh the latest rates. Please try again."
        : "لم نتمكن من تحديث أحدث الأسعار. يرجى المحاولة مرة أخرى.";
    }
    return lang === 'en'
      ? "Something went wrong. Please try again."
      : "حدث خطأ ما. يرجى المحاولة مرة أخرى.";
  },

  /**
   * Returns a friendly explanation for empty lists.
   */
  formatEmptyState: (type: 'transfers' | 'alerts', lang: 'en' | 'ar'): string => {
    if (type === 'transfers') {
      return lang === 'en'
        ? "You haven't made any transfers yet."
        : "لم تقم بأي عمليات تحويل بعد.";
    }
    return lang === 'en'
      ? "Create a rate alert and we'll notify you when rates improve."
      : "أنشئ تنبيهاً للأسعار وسنقوم بإعلامك عندما تتحسن الأسعار.";
  },

  /**
   * Formats a user-friendly source label based on the technical source type.
   */
  formatSourceLabel: (sourceType: string, lang: 'en' | 'ar'): string => {
    switch (sourceType) {
      case 'admin_override':
        return lang === 'en' ? "Verified Manual Update" : "تحديث يدوي معتمد";
      case 'community_verified':
        return lang === 'en' ? "Verified by Other Expats" : "مؤكد من قبل مغتربين آخرين";
      case 'manual_channel_rate':
        return lang === 'en' ? "Verified Source" : "مصدر مؤكد";
      case 'market_reference':
        return lang === 'en' ? "Today's Market Rate" : "سعر السوق اليوم";
      default:
        return lang === 'en' ? "Updated Recently" : "تم تحديثه مؤخراً";
    }
  }
};
