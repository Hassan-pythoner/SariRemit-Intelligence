import React, { useState, useEffect } from 'react';
import { TranslationDict } from '../types';
import { CORRIDORS } from '../services/ratesService';
import { getRecommendations, getAuthSession } from '../services/supabaseService';
import { 
  HeartHandshake, ShieldCheck, Zap, Sparkles, ArrowRight, ArrowLeft, 
  ChevronDown, ChevronUp, Landmark, FileText, CheckCircle2, AlertTriangle, 
  Mail, MessageSquare, ExternalLink, HelpCircle, UserPlus, Phone, Globe, MapPin, Award, Lock, Info
} from 'lucide-react';
import { SDSButton, SDSCard, SDSBadge, SDSInput, SDSSelect } from './Sds';
import logoImg from '../assets/images/sariremit_logo_1783671155763.jpg';
import heroBg from '../assets/images/hero_bg_1783671141946.jpg';

interface LandingPageProps {
  setActiveTab: (tab: string) => void;
  language: 'en' | 'ar';
  t: TranslationDict;
  setQuickSearch: (search: { corridorId: string; amount: number }) => void;
  isLoggedIn: boolean;
}

export default function LandingPage({
  setActiveTab,
  language,
  t,
  setQuickSearch,
  isLoggedIn,
}: LandingPageProps) {
  const isRtl = language === 'ar';
  const [amount, setAmount] = useState<number>(1000);
  const [selectedCorridor, setSelectedCorridor] = useState<string>(() => {
    const session = getAuthSession();
    return session.user?.preferredCorridorId || 'sa-pk';
  });
  const [resolvedRate, setResolvedRate] = useState<number>(0);
  const [bestProvider, setBestProvider] = useState<string>('Digital Wallet');
  
  // Auto-cycling states for landing page engagement
  const [isAutoCycling, setIsAutoCycling] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  
  // Accordion state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Synchronize with user's preferred country when logged in
  useEffect(() => {
    const session = getAuthSession();
    if (session.user?.preferredCorridorId) {
      setSelectedCorridor(session.user.preferredCorridorId);
      setIsAutoCycling(false); // Stop auto-cycling to prioritize user profile defaults
    }
  }, []);

  // Auto-cycling Effect: Cycles through destinations to show live data
  useEffect(() => {
    if (!isAutoCycling || isHovered) return;

    const interval = setInterval(() => {
      setSelectedCorridor((current) => {
        const currentIndex = CORRIDORS.findIndex(c => c.id === current);
        const nextIndex = (currentIndex + 1) % CORRIDORS.length;
        return CORRIDORS[nextIndex].id;
      });
    }, 4500); // Cycle every 4.5 seconds for a premium and comfortable cadence

    return () => clearInterval(interval);
  }, [isAutoCycling, isHovered]);

  const activeCorridor = CORRIDORS.find(c => c.id === selectedCorridor) || CORRIDORS[0];

  // Fetch the best provider rate dynamically
  useEffect(() => {
    let isMounted = true;
    setResolvedRate(activeCorridor.baseExchangeRate);
    getRecommendations(selectedCorridor, amount)
      .then(res => {
        if (isMounted && res.bestOption) {
          const matchedOption = res.allOptions.find(o => o.resolved.provider_id === res.bestOption.best_provider_id);
          if (matchedOption) {
            setResolvedRate(matchedOption.resolved.resolved_rate);
            setBestProvider(matchedOption.resolved.provider_name);
          }
        }
      })
      .catch(err => {
        console.warn('Landing Page RRE Fetch Failed:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedCorridor, amount]);

  const handleStartComparing = () => {
    if (!isLoggedIn) {
      setActiveTab('sign-in');
      return;
    }
    setQuickSearch({
      corridorId: selectedCorridor,
      amount: amount
    });
    setActiveTab('compare');
  };

  // Dedicated Bilingual Dictionary for Redesign
  const dict = {
    en: {
      badge: "REMITTANCE INTELLIGENCE FOR EXPATS",
      heroTitle: "Transfer With Confidence.",
      heroSub: "Know where, when, and how to send money home before making your transfer.",
      heroDesc: "SariRemit helps expatriates in Saudi Arabia make confident remittance decisions by comparing provider rates, fees, VAT, final family payout, and verified intelligence in one clear experience.",
      heroCta: "Compare Rates Now",
      heroSecondary: "See How It Works",
      heroHelper: "SariRemit does not hold or transfer your money. We provide independent decision-support intelligence before you use a remittance provider.",
      trust1: "Independent Recommendations",
      trust2: "Transparent Cost Comparison",
      trust3: "Verified Rate Intelligence",
      trust4: "Built for Expats in Saudi Arabia",
      
      valTitle: "Everything You Need Before You Send",
      val1Title: "Compare Real Transfer Value",
      val1Desc: "See exchange rates, fees, VAT, and the final amount your family may receive.",
      val2Title: "Understand the Recommendation",
      val2Desc: "Know why a provider is recommended instead of receiving an unexplained ranking.",
      val3Title: "Track Your Savings",
      val3Desc: "Record transfers and understand how better decisions add up over time.",
      val4Title: "Strengthen Verified Intelligence",
      val4Desc: "Submit evidence-backed transfer rates that can be reviewed before supporting community intelligence.",
      
      howTitle: "How SariRemit Works",
      howSub: "From uncertainty to a clear decision in four simple steps.",
      step1Title: "Choose Your Destination",
      step1Desc: "Select where you are sending money and enter the amount.",
      step2Title: "Compare Providers",
      step2Desc: "SariRemit evaluates exchange rates, fees, VAT, and expected family payout.",
      step3Title: "Review the Recommendation",
      step3Desc: "See the best available option, confidence level, and an explanation of why it is recommended.",
      step4Title: "Transfer Through Your Provider",
      step4Desc: "Complete the transaction directly with the chosen bank, wallet, or remittance provider.",
      howNote: "SariRemit is an independent intelligence platform and does not process, receive, or hold customer funds.",
      
      aboutTitle: "Why SariRemit Exists",
      aboutBody: "Millions of expatriates work far from home and regularly support the people they care about. Yet choosing a remittance provider can involve confusing rates, hidden costs, different fees, VAT, and uncertainty about the final payout. SariRemit was created to replace that uncertainty with clear, transparent, and trusted remittance intelligence.",
      missionTitle: "Our Mission",
      mission: "Our mission is to help expatriates make confident remittance decisions through trusted intelligence.",
      visionTitle: "Our Vision",
      vision: "Our vision is to become the most trusted remittance intelligence platform for expatriates.",
      aboutFounder: "Founded with the belief that every expatriate deserves confidence before sending money home.",
      
      whyTitle: "More Than a Rate Comparison",
      why1Title: "Final Family Value",
      why1Desc: "We focus on what the recipient may actually receive after relevant fees and charges.",
      why2Title: "Independent Intelligence",
      why2Desc: "Providers cannot pay to become SariRemit’s recommendation.",
      why3Title: "Transparent Reasoning",
      why3Desc: "Recommendations should be understandable and explainable.",
      why4Title: "Evidence-Based Community Rates",
      why4Desc: "Community submissions require supporting evidence and management review.",
      why5Title: "Mobile-First Simplicity",
      why5Desc: "The platform reduces navigation and presents the most important decision information first.",
      why6Title: "Savings Visibility",
      why6Desc: "Users can record transfers and understand their cumulative savings.",
      
      trustTitle: "Confidence Requires Transparency",
      trustSub: "SariRemit does not ask users to trust a mysterious algorithm. We aim to show what information supports each recommendation and how fresh it is.",
      trustCardTitle: "Our Transparency Framework",
      trustPoint1: "Full Rate Source Visibility",
      trustPoint2: "Real-Time Freshness Timestamps",
      trustPoint3: "All Fees & VAT Displayed Clearly",
      trustPoint4: "Evidence-Required Community Submissions",
      trustPoint5: "Manual Human Management Review",
      trustPoint6: "Strict Independent Recommendation Policy",
      trustPoint7: "Zero Commercial Paid Rankings",
      trustPolicy: "No partnership, promotion, or commercial agreement may purchase a higher recommendation ranking.",
      trustUncertainty: "If reliable information is unavailable, SariRemit should communicate uncertainty rather than display misleading certainty.",
      
      expTitle: "Designed for Faster, Clearer Decisions",
      expSub: "Desktop supports deeper comparison. Mobile is optimized for quick, confident decisions with less navigation.",
      expMock1: "Mobile Recommendation",
      expMock2: "Rate Comparison View",
      expMock3: "Savings Ledger",
      expMock4: "Verify Receipt",
      
      commTitle: "Verified by Evidence, Not Popularity",
      commBody: "Users may submit details from completed transfers with supporting screenshots. Submissions remain pending until reviewed and approved. Unreviewed rates must not influence SariRemit recommendations.",
      commS1: "User submits evidence",
      commS2: "Management reviews",
      commS3: "Approved intelligence",
      commS4: "Recommendation support",
      
      saveTitle: "See the Value of Better Decisions",
      saveBody: "After making a transfer, users can record it and track how much they may have saved compared with other available options.",
      saveMockTitle: "Your Cumulative Savings (Illustrative)",
      saveM1: "Monthly Savings",
      saveM2: "Lifetime Savings",
      saveM3: "Transfers Recorded",
      saveM4: "Corridors Tracked",
      saveLabel: "Illustrative Example Only",
      
      respTitle: "What SariRemit Is — and Is Not",
      respIs: "SariRemit Is:",
      respIs1: "A remittance intelligence platform",
      respIs2: "A comparison and decision-support tool",
      respIs3: "An independent source of transfer information",
      respIs4: "A platform for verified community evidence",
      respIsNot: "SariRemit Is Not:",
      respIsNot1: "A bank",
      respIsNot2: "A money transfer operator",
      respIsNot3: "A remittance wallet",
      respIsNot4: "A financial adviser",
      respIsNot5: "A guarantee of a provider's final transaction outcome",
      respDisclaimer: "Rates and provider terms can change. Users should confirm final details directly with the chosen provider before completing a transaction.",
      
      faqTitle: "Frequently Asked Questions",
      finalTitle: "Know Before You Send.",
      finalSub: "Compare providers, understand the true cost, and make your next remittance decision with confidence.",
      finalCtaPrimary: "Compare Rates Now",
      finalCtaSecondary: "Create an Account",
      finalHelper: "Start by comparing. Create an account when you are ready to record savings, submit verified rates, or save your preferences.",
      
      contactTitle: "Contact Our Intelligence Team",
      contactSub: "Have questions, feedback, or need support? Drop us a message below.",
      contactFormNote: "Future contact form placeholder. This form will connect to our database once configuration completes.",
      contactDirect: "For immediate assistance, please email support@sariremit.com or click below to file an issue report.",
      contactBtn: "Send Message"
    },
    ar: {
      badge: "ذكاء الحوالات للمغتربين",
      heroTitle: "حول أموالك بكل ثقة.",
      heroSub: "اعرف أين، ومتى، وكيف ترسل الأموال إلى بلدك قبل إجراء الحوالة.",
      heroDesc: "يساعد ساري ريميت المغتربين في المملكة العربية السعودية على اتخاذ قرارات تحويل واثقة من خلال مقارنة أسعار قنوات التحويل، الرسوم، ضريبة القيمة المضافة، والمبلغ النهائي للعائلة في تجربة واحدة واضحة.",
      heroCta: "قارن الأسعار الآن",
      heroSecondary: "شاهد كيف يعمل",
      heroHelper: "ساري ريميت لا يحتفظ بأموالك ولا يقوم بتحويلها. نحن نقدم معلومات مستقلة لدعم قرارك قبل استخدام أي من مزودي خدمات التحويل.",
      trust1: "توصيات مستقلة بالكامل",
      trust2: "مقارنة تكاليف شفافة",
      trust3: "معلومات أسعار مؤكدة بالأدلة",
      trust4: "مصمم للمغتربين في السعودية",
      
      valTitle: "كل ما تحتاجه قبل الإرسال",
      val1Title: "قارن القيمة الفعلية للتحويل",
      val1Desc: "اطلع على أسعار الصرف، الرسوم، ضريبة القيمة المضافة، والمبلغ النهائي الذي ستستلمه عائلتك.",
      val2Title: "افهم سبب التوصية",
      val2Desc: "اعرف سبب التوصية بقناة تحويل معينة بدلاً من الحصول على ترتيب عشوائي غير مفسر.",
      val3Title: "تتبع مدخراتك",
      val3Desc: "دون تحويلاتك وافهم كيف تتراكم قراراتك الأفضل لتتحول إلى وفورات بمرور الوقت.",
      val4Title: "عزز البيانات الموثوقة",
      val4Desc: "أرسل أسعار تحويل مدعومة بالأدلة ليتم مراجعتها قبل اعتمادها لخدمة مجتمع المغتربين.",
      
      howTitle: "كيف يعمل ساري ريميت",
      howSub: "من الحيرة إلى القرار الواضح في أربع خطوات بسيطة.",
      step1Title: "اختر وجهتك ورصيدك",
      step1Desc: "اختر البلد الذي ترسل إليه وأدخل المبلغ بالريال السعودي.",
      step2Title: "قارن القنوات المتاحة",
      step2Desc: "يقوم ساري ريميت بتقييم أسعار الصرف، الرسوم، ضريبة القيمة المضافة، والمبلغ النهائي المتوقع.",
      step3Title: "راجع التوصية المستقلة",
      step3Desc: "شاهد الخيار الأفضل المتاح، درجة الثقة، وتفسيراً تفصيلياً لسبب اختياره.",
      step4Title: "حول عبر مزود الخدمة",
      step4Desc: "أكمل المعاملة مباشرة من خلال البنك، المحفظة الرقمية، أو مزود الخدمة الذي اخترته.",
      howNote: "ساري ريميت هي منصة معلومات مستقلة ولا تقوم بمعالجة أو استلام أو الاحتفاظ بأموال العملاء.",
      
      aboutTitle: "لماذا تأسس ساري ريميت",
      aboutBody: "يعمل ملايين المغتربين بعيداً عن أوطانهم ليدعموا عائلاتهم بانتظام. ومع ذلك، فإن اختيار قناة التحويل المناسبة ينطوي على أسعار صرف مربكة، تكاليف خفية، رسوم متباينة وضريبة قيمة مضافة، إلى جانب الحيرة بشأن المبلغ المستلم النهائي. تم إنشاء ساري ريميت لاستبدال تلك الحيرة بمعلومات واضحة، شفافة، وموثوقة.",
      missionTitle: "مهمتنا",
      mission: "مهمتنا هي مساعدة المغتربين على اتخاذ قرارات تحويل واثقة من خلال معلومات موثوقة.",
      visionTitle: "رؤيتنا",
      vision: "رؤيتنا هي أن نصبح المنصة الأكثر موثوقية لمعلومات تحويلات المغتربين.",
      aboutFounder: "تأسس على الإيمان بأن كل مغترب يستحق الثقة الكاملة والوضوح قبل إرسال أمواله وعرقه إلى بلده.",
      
      whyTitle: "أكثر من مجرد مقارنة أسعار",
      why1Title: "القيمة النهائية للعائلة",
      why1Desc: "نركز على ما يستلمه المستلم الفعلي بعد خصم كافة الرسوم والضرائب.",
      why2Title: "معلومات مستقلة",
      why2Desc: "لا يمكن لمزودي الخدمة الدفع مقابل تصدر توصياتنا.",
      why3Title: "أسباب شفافة ومفسرة",
      why3Desc: "يجب أن تكون التوصيات مفهومة ومبنية على أسباب واضحة.",
      why4Title: "أسعار مجتمعية مثبتة بالدليل",
      why4Desc: "تتطلب مساهمات الأسعار من المجتمع لقطات شاشة داعمة ومراجعة إدارية صارمة.",
      why5Title: "سهولة الاستخدام للهاتف",
      why5Desc: "تركز المنصة على تبسيط التصفح وتقديم المعلومات الأكثر أهمية أولاً على الهاتف.",
      why6Title: "وضوح المدخرات والوفر",
      why6Desc: "يمكن للمستخدمين تسجيل تحويلاتهم الفعلية ومتابعة وفرهم المتراكم بمرور الوقت.",
      
      trustTitle: "الثقة تتطلب الشفافية",
      trustSub: "ساري ريميت لا يطلب من المستخدمين الوثوق بخوارزمية غامضة. نهدف إلى توضيح المعلومات التي تدعم كل توصية ومدى حداثتها.",
      trustCardTitle: "إطار الشفافية لدينا",
      trustPoint1: "وضوح كامل لمصدر السعر",
      trustPoint2: "طوابع زمنية لحداثة البيانات",
      trustPoint3: "عرض الرسوم والضريبة بوضوح",
      trustPoint4: "مشاركات تتطلب لقطة شاشة كدليل",
      trustPoint5: "مراجعة وتدقيق إداري يدوي",
      trustPoint6: "سياسة مستقلة تماماً للتوصيات",
      trustPoint7: "صفر إعلانات أو ترتيب مدفوع",
      trustPolicy: "لا يمكن لأي شراكة أو ترويج أو اتفاق تجاري شراء ترتيب أعلى في توصياتنا على الإطلاق.",
      trustUncertainty: "إذا كانت المعلومات الموثوقة غير متوفرة لممر معين، فإن ساري ريميت يوضح عدم اليقين بدلاً من عرض ثقة مضللة.",
      
      expTitle: "مصمم لقرارات أسرع وأوضح",
      expSub: "تدعم شاشة الكمبيوتر مقارنة أعمق وتفاصيل أشمل. بينما تم تحسين شاشة الهاتف لقرارات سريعة واثقة بتصفح بسيط.",
      expMock1: "توصية الهاتف",
      expMock2: "جدول مقارنة الأسعار",
      expMock3: "سجل المدخرات والوفر",
      expMock4: "تأكيد رفع الإيصال",
      
      commTitle: "موثق بالأدلة، وليس بالشعبية",
      commBody: "يمكن للمستخدمين تقديم تفاصيل التحويلات المكتملة مع إرفاق لقطات شاشة داعمة. تظل المشاركات معلقة حتى يتم مراجعتها واعتمادها من الإدارة. الأسعار غير المراجعة لا تؤثر على توصيات ساري ريميت.",
      commS1: "المستخدم يرفع الدليل واللقطة",
      commS2: "الإدارة تدقق وتراجع يدوياً",
      commS3: "اعتماد السعر وتأكيده",
      commS4: "تحديث محرك التوصيات والأسعار",
      
      saveTitle: "شاهد قيمة القرارات الأفضل",
      saveBody: "بعد إجراء التحويل، يمكن للمستخدمين تدوينه وتتبع مقدار الوفر الفعلي مقارنة بالخيارات المتاحة الأخرى في ذلك الوقت.",
      saveMockTitle: "مدخراتك المتراكمة (نموذج توضيحي)",
      saveM1: "الوفر هذا الشهر",
      saveM2: "الوفر الإجمالي المتراكم",
      saveM3: "العمليات المسجلة",
      saveM4: "الممرات المستخدمة",
      saveLabel: "نموذج توضيحي فقط لغرض العرض",
      
      respTitle: "ما هي منصة ساري ريميت وما هي ليست",
      respIs: "ساري ريميت هي:",
      respIs1: "منصة لمعلومات تحويلات المغتربين",
      respIs2: "أداة مقارنة ودعم القرار المستقل",
      respIs3: "مصدر مستقل لمعلومات التحويلات",
      respIs4: "منصة لمشاركات الأسعار المؤكدة بالأدلة",
      respIsNot: "ساري ريميت ليست:",
      respIsNot1: "بنكاً أو مصرفاً مالياً",
      respIsNot2: "مشغلاً لتحويل الأموال",
      respIsNot3: "محفظة تحويل أموال رقمية",
      respIsNot4: "مستشاراً مالياً مرخصاً",
      respIsNot5: "ضماناً للنتيجة النهائية للمعاملة البنكية",
      respDisclaimer: "قد تتغير الأسعار وشروط مزودي الخدمة باستمرار. يجب على المستخدمين تأكيد التفاصيل النهائية مباشرة مع المزود المختار قبل إتمام التحويل.",
      
      faqTitle: "الأسئلة الشائعة والأجوبة",
      finalTitle: "اعرف تماماً قبل أن ترسل.",
      finalSub: "قارن بين مقدمي الخدمات، وافهم التكلفة الحقيقية، واتخذ قرارك القادم للتحويل بكل ثقة وأمان.",
      finalCtaPrimary: "قارن الأسعار الآن",
      finalCtaSecondary: "أنشئ حساباً مجانياً",
      finalHelper: "ابدأ بمقارنة الأسعار أولاً. وأنشئ حسابك عندما تكون مستعداً لتسجيل مدخراتك، مشاركة الأسعار المؤكدة، أو حفظ تفضيلاتك.",
      
      contactTitle: "اتصل بفريق معلومات ساري ريميت",
      contactSub: "هل لديك أي استفسارات أو ملاحظات؟ يسعدنا تواصلك معنا.",
      contactFormNote: "نموذج اتصال تجريبي للمستقبل. سيتم ربطه بقواعد البيانات السحابية قريباً عند اكتمال البناء.",
      contactDirect: "للمساعدة الفورية، يرجى مراسلتنا عبر البريد الإلكتروني support@sariremit.com أو الإبلاغ عن مشكلة أدناه.",
      contactBtn: "إرسال الرسالة"
    }
  };

  const lt = dict[language];

  // FAQS Data
  const faqs = [
    {
      qEn: "What is SariRemit?",
      qAr: "ما هو ساري ريميت؟",
      aEn: "SariRemit is an independent crowd-sourced decision support platform for expatriates in Saudi Arabia. We aggregate exchange rates, fees, VAT, and verified community screenshot evidence so you can determine the true final value before initiating a transfer.",
      aAr: "ساري ريميت هي منصة مستقلة وتشاركية لدعم القرار مصممة خصيصاً للمغتربين في المملكة العربية السعودية. نحن نجمع ونقارن أسعار الصرف، الرسوم، ضريبة القيمة المضافة، بالإضافة إلى لقطات الشاشة المرفوعة من المجتمع للتحقق من أفضل قيمة حقيقية للتحويل."
    },
    {
      qEn: "Does SariRemit transfer money directly?",
      qAr: "هل يقوم ساري ريميت بتحويل الأموال مباشرة؟",
      aEn: "No. SariRemit is purely an independent intelligence platform. We do not receive, hold, process, or transmit customer funds. You complete your transactions directly and securely within your chosen wallet app or bank counter.",
      aAr: "لا. ساري ريميت هي منصة معلوماتية مستقلة تماماً. نحن لا نستقبل أو نحتفظ أو نعالج أو ننقل أي أموال. يمكنك إكمال عمليتك مباشرة وبشكل آمن من داخل تطبيق المحفظة الرقمية أو البنك المعتمد الخاص بك."
    },
    {
      qEn: "How does SariRemit recommend a provider?",
      qAr: "كيف يوصي ساري ريميت بمزود تحويل معين؟",
      aEn: "Our Rate Resolution Engine (RRE) processes live rates and evaluates them based on final recipient payout (inclusive of fees and VAT), data freshness timestamps, and confidence filters. Providers cannot pay to rank first; rankings are strictly algorithmic and independent.",
      aAr: "يقوم محرك تسوية الأسعار الخاص بنا (RRE) بمعالجة الأسعار الحالية وتقييمها بناءً على المبلغ النهائي المستلم (بما في ذلك الرسوم والضرائب) وطوابع تحديث البيانات. لا يمكن للشركات الدفع مقابل تصدر الترتيب، فهو يعتمد كلياً على البيانات الحقيقية المستقلة."
    },
    {
      qEn: "Are rates guaranteed on SariRemit?",
      qAr: "هل الأسعار المعروضة مضمونة على ساري ريميت؟",
      aEn: "No. Rates fluctuate dynamically in the foreign exchange market. We show the freshest verified rates, but you must always confirm final parameters directly inside the provider's application before pressing send.",
      aAr: "لا. أسعار الصرف تتغير ديناميكياً باستمرار في الأسواق. نحن نعرض أحدث الأسعار المؤكدة، لكن يجب عليك دائماً التحقق من السعر النهائي داخل تطبيق مزود الخدمة قبل إرسال الأموال."
    },
    {
      qEn: "Why are screenshots required for submitted rates?",
      qAr: "لماذا تطلب المنصة لقطات شاشة للأسعار المساهم بها؟",
      aEn: "To block spam and prevent false data from skewing our recommendations. Requiring an unaltered screenshot of a receipt or mobile screen ensures only legitimate, real-world rates are integrated into our community intelligence database.",
      aAr: "لمنع البيانات المزيفة والعشوائية من التأثير على دقة التوصيات. إن اشتراط رفع لقطة شاشة حقيقية وغير معدلة يضمن إدراج الأسعار الواقعية والصحيحة فقط في قاعدة بياناتنا لخدمة الجميع."
    },
    {
      qEn: "Can providers pay to rank first?",
      qAr: "هل يمكن لقنوات التحويل الدفع لتصدر الترتيب؟",
      aEn: "No. SariRemit has a strict independent recommendation policy. No financial incentive, commercial promotion, or bank partnership can influence our algorithmic rankings.",
      aAr: "لا، على الإطلاق. يمتلك ساري ريميت سياسة صارمة للتوصية المستقلة. لا يمكن لأي شراكة تجارية أو ترويج مالي التأثير على خوارزميات الترتيب لدينا."
    },
    {
      qEn: "Do I need an account to compare rates?",
      qAr: "هل أحتاج إلى إنشاء حساب لمقارنة الأسعار؟",
      aEn: "You can view the basic rates calculator for free. However, a free account is required to unlock full recommendations, confidence metrics, customized rate alerts, and cumulative savings tracking.",
      aAr: "يمكنك استخدام حاسبة الأسعار الأساسية مجاناً وبدون حساب. ومع ذلك، يتطلب عرض التوصية الكاملة ومؤشرات الثقة المتقدمة وإنشاء التنبيهات وتتبع مدخراتك إنشاء حساب مجاني."
    },
    {
      qEn: "What information is stored when I create an account?",
      qAr: "ما هي المعلومات المخزنة عند إنشاء حساب؟",
      aEn: "We store only basic credentials (name, email, phone) and your preferred corridor choices. We never request or store sensitive banking details since we do not process financial transactions.",
      aAr: "نحن نخزن فقط معلومات التسجيل الأساسية (الاسم، البريد الإلكتروني، الهاتف) والبلدان المفضلة للتحويل. لا نطلب ولا نخزن أبداً أي معلومات بنكية حساسة نظراً لأننا لا نقوم بمعالجات مالية."
    },
    {
      qEn: "How does SariRemit protect my personal information?",
      qAr: "كيف يحمي ساري ريميت معلوماتي الشخصية؟",
      aEn: "We utilize secure Supabase databases, transport-level SSL encryption, and strict data-handling policies. We advice croping personal details out of community screenshot uploads to maximize safety.",
      aAr: "نحن نستخدم قواعد بيانات Supabase المشفرة والآمنة، بروتوكولات حماية SSL، وسياسات معالجة صارمة. كما ننصح دائماً بقص أو إخفاء التفاصيل الشخصية من صور الإيصالات لضمان سلامتك."
    },
    {
      qEn: "What should I do if a displayed rate differs from the provider?",
      qAr: "ماذا أفعل إذا اختلف السعر المعروض عن سعر التطبيق الفعلي؟",
      aEn: "Please report the discrepancy using the contact form or submit a fresh verified rate contribution with your screenshot. This keeps the platform accurate and protects your fellow community members.",
      aAr: "يرجى الإبلاغ عن الاختلاف فوراً باستخدام نموذج الاتصال بنا أو تقديم مساهمة جديدة بسعر الصرف المؤكد مع إرفاق لقطة الشاشة المحدثة لمساعدة مجتمع المغتربين."
    }
  ];

  // ----------------------------------------------------
  // SUBTLE BACKGROUND COMPONENT UTILITIES
  // ----------------------------------------------------
  const SaudiSkyline = () => (
    <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none opacity-[0.04] select-none z-0">
      <svg viewBox="0 0 1200 120" className="w-full h-full fill-slate-300" preserveAspectRatio="none">
        <path d="M0,120 L40,120 L40,90 L50,90 L50,120 L100,120 L100,50 L110,40 L120,50 L120,120 L160,120 L160,95 L175,95 L175,120 L220,120 L220,70 L230,60 L240,70 L240,120 L280,120 L280,30 L295,10 L310,30 L310,120 L350,120 L350,105 L360,105 L360,120 L400,120 L400,80 L415,80 L415,120 L460,120 L460,45 L470,35 L480,45 L480,120 L530,120 L530,110 L540,110 L540,120 L580,120 L580,60 L590,50 L600,60 L600,120 L660,120 L660,85 L675,85 L675,120 L720,120 L720,20 L735,0 L750,20 L750,120 L800,120 L800,90 L810,90 L810,120 L860,120 L860,55 L870,45 L880,55 L880,120 L930,120 L930,100 L940,100 L940,120 L990,120 L990,75 L1005,75 L1005,120 L1060,120 L1060,40 L1070,30 L1080,40 L1080,120 L1130,120 L1130,105 L1140,105 L1140,120 L1200,120 Z" />
      </svg>
    </div>
  );

  const ConnectionLines = () => (
    <div className="absolute inset-0 pointer-events-none opacity-[0.06] select-none z-0 overflow-hidden">
      <svg viewBox="0 0 800 400" className="w-full h-full stroke-amber-400 fill-none" preserveAspectRatio="none">
        {/* Connection arcs representing remittance channels */}
        <path d="M 150 180 Q 300 80 450 200" strokeWidth="2.5" strokeDasharray="6 6" />
        <path d="M 150 180 Q 350 120 580 240" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M 150 180 Q 250 50 350 150" strokeWidth="2.5" />
        <path d="M 150 180 Q 400 60 680 190" strokeWidth="1.5" strokeDasharray="3 3" />
        
        {/* Saudi Arabia center node */}
        <circle cx="150" cy="180" r="7" className="fill-amber-500/30 stroke-amber-400 stroke-2 animate-pulse" />
        <text x="135" y="155" className="fill-amber-300 font-mono text-[11px] font-black tracking-wider">KSA</text>
        
        {/* Destination nodes */}
        <circle cx="450" cy="200" r="4" className="fill-emerald-500/20 stroke-emerald-400" />
        <circle cx="580" cy="240" r="4" className="fill-emerald-500/20 stroke-emerald-400" />
        <circle cx="350" cy="150" r="4" className="fill-emerald-500/20 stroke-emerald-400" />
        <circle cx="680" cy="190" r="4" className="fill-emerald-500/20 stroke-emerald-400" />
      </svg>
    </div>
  );

  const GeometricGrid = () => (
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none select-none z-0" />
  );

  const AbstractWorldMap = () => (
    <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none z-0 overflow-hidden flex items-center justify-center">
      <svg viewBox="0 0 1000 500" className="w-11/12 h-11/12 fill-slate-300" preserveAspectRatio="xMidYMid meet">
        {/* Stylized simplified abstract map points */}
        <circle cx="150" cy="100" r="3" /><circle cx="200" cy="110" r="3" /><circle cx="220" cy="90" r="3" />
        <circle cx="180" cy="150" r="4" /><circle cx="140" cy="180" r="3" /><circle cx="210" cy="220" r="3" />
        <circle cx="400" cy="160" r="4" /><circle cx="420" cy="130" r="3" /><circle cx="450" cy="190" r="3" />
        <circle cx="510" cy="180" r="6" />{/* Middle East core */}
        <circle cx="530" cy="190" r="3" /><circle cx="490" cy="200" r="3" /><circle cx="550" cy="160" r="3" />
        <circle cx="620" cy="220" r="4" /><circle cx="640" cy="240" r="3" /><circle cx="660" cy="200" r="5" />
        <circle cx="700" cy="250" r="3" /><circle cx="730" cy="210" r="4" /><circle cx="780" cy="260" r="3" />
        <circle cx="810" cy="280" r="3" /><circle cx="850" cy="230" r="4" /><circle cx="890" cy="220" r="3" />
      </svg>
    </div>
  );

  return (
    <div className="w-full animate-fadeIn text-slate-100 bg-[#071A35] font-sans">
      
      {/* 1. HERO SECTION WITH IMAGE BACKGROUND & GRADIENT OVERLAY (DEEP NAVY GRADIENT) */}
      <section 
        id="home"
        className="relative overflow-hidden w-full py-16 sm:py-24 md:py-32 bg-gradient-to-b from-[#071A35] via-[#091F3E] to-[#0A2449] border-b border-slate-800/60"
      >
        {/* Full-width Hero image background with dark premium overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center select-none"
          style={{ 
            backgroundImage: `url(${heroBg})`,
            opacity: 0.16
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A2449] via-transparent to-[#071A35] opacity-95 z-0" />
        
        {/* Abstract design elements */}
        <GeometricGrid />
        <ConnectionLines />
        <AbstractWorldMap />
        <SaudiSkyline />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className={`inline-flex items-center gap-2 px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">{lt.badge}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-black text-white tracking-tight leading-none">
              {lt.heroTitle} 
              <span className="text-amber-400 block mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-normal">
                {lt.heroSub}
              </span>
            </h1>
            
            <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed font-medium">
              {lt.heroDesc}
            </p>

            {/* Trust Indicators in Hero */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-800/60">
              {[lt.trust1, lt.trust2, lt.trust3, lt.trust4].map((indicator, index) => (
                <div key={index} className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/40" />
                  <span>{indicator}</span>
                </div>
              ))}
            </div>

            {/* Helper Text */}
            <p className="text-[11px] text-slate-400 leading-normal max-w-lg font-mono">
              💡 {lt.heroHelper}
            </p>
          </div>
          
          {/* Hero Right: Live Calculator Widget (Premium Dark Glass Card with automatic preview cycling) */}
          <div 
            className="lg:col-span-5 bg-[#0C2547]/85 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-700/50 space-y-6 transition-all duration-300 hover:border-amber-400/20"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-xs sm:text-sm font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  ⚡ {isRtl ? 'حاسبة الأسعار السريعة' : 'Quick Rates Finder'}
                </h3>
                {isAutoCycling && (
                  <span className="text-[9px] font-mono text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isHovered ? 'bg-slate-400' : 'bg-emerald-400'} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isHovered ? 'bg-slate-400' : 'bg-emerald-500'}`}></span>
                    </span>
                    {isHovered 
                      ? (language === 'en' ? 'Demo Paused (hover)' : 'تم إيقاف العرض مؤقتاً') 
                      : (language === 'en' ? 'Live cycling demo' : 'عرض حي تلقائي')}
                  </span>
                )}
              </div>
              <SDSBadge type="fresh" className="!bg-emerald-500/15 !text-emerald-400 font-mono text-[9px] uppercase tracking-wider border border-emerald-500/20" />
            </div>
            
            <div className="space-y-4">
              {/* Amount Input */}
              <SDSInput
                label={t.sendingAmount}
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(Math.max(1, parseInt(e.target.value) || 0));
                  setIsAutoCycling(false); // Permanently disable auto-cycling on manual amount typing
                }}
                icon={<span className="font-black text-xs text-amber-400">SAR</span>}
                className="font-mono text-lg bg-[#071A35]/90 border-slate-700 text-white focus:border-amber-400 focus:ring-amber-400 rounded-xl"
              />

              {/* Destination Selection */}
              <SDSSelect
                label={t.chooseCountry}
                value={selectedCorridor}
                onChange={(e) => {
                  setSelectedCorridor(e.target.value);
                  setIsAutoCycling(false); // Permanently disable auto-cycling on manual destination selection
                }}
                options={CORRIDORS.map(c => ({
                  value: c.id,
                  label: `${c.flag} Send to ${language === 'en' ? c.toCountry : c.toCountryAr} (${c.currencyCode})`
                }))}
                className="bg-[#071A35]/90 border-slate-700 text-white focus:border-amber-400 rounded-xl text-xs sm:text-sm"
              />

              {/* Estimate Preview - Force key update to trigger standard CSS fade/glow on corridor change */}
              <div 
                key={`payout-${selectedCorridor}`}
                className="p-4 rounded-xl bg-[#071A35]/60 border border-slate-700/50 flex items-center justify-between shadow-inner animate-fadeIn transition-all duration-300"
              >
                <div className="text-left space-y-1">
                  <span className="text-[10px] font-mono font-bold text-amber-400 block uppercase tracking-wider">Best Rate ({bestProvider})</span>
                  <span className="font-mono text-xs font-bold text-slate-100">
                    1 SAR ≈ {resolvedRate || activeCorridor.baseExchangeRate} {activeCorridor.currencyCode}
                  </span>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Max Est Payout</span>
                  <span className="font-mono text-sm font-black text-emerald-400">
                    {(amount * (resolvedRate || activeCorridor.baseExchangeRate)).toLocaleString(undefined, { maximumFractionDigits: 1 })} {activeCorridor.currencyCode}
                  </span>
                </div>
              </div>

              {!isLoggedIn && (
                <div className="p-3.5 rounded-xl bg-amber-400/5 border border-amber-400/10 text-left space-y-1.5">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    {language === 'en' ? 'Limited Public Preview' : 'معاينة عامة محدودة'}
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    {language === 'en' 
                      ? 'Sign in to see full recommendation. Create an account to unlock verified rates, confidence scores, custom alerts, and savings tracking.' 
                      : 'سجل الدخول لعرض التوصية الكاملة. أنشئ حساباً لفتح الأسعار المؤكدة، درجات الثقة، التنبيهات المخصصة، وتتبع الوفر.'}
                  </p>
                </div>
              )}

              {/* Action Button - Green strictly reserved for main CTA */}
              <SDSButton
                id="landing-hero-compare-btn"
                onClick={handleStartComparing}
                variant="primary"
                fullWidth
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase py-3.5 shadow-lg shadow-emerald-950/20 rounded-xl transition-all duration-300"
                icon={isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                {lt.heroCta}
              </SDSButton>
            </div>
          </div>
          
        </div>
      </section>

      {/* 2. QUICK VALUE PROPOSITION SECTION (SLIGHTLY LIGHTER NAVY GRADIENT) */}
      <section className="relative overflow-hidden w-full py-16 sm:py-24 bg-gradient-to-b from-[#0C2547] to-[#0A203F] border-b border-slate-800/60">
        <GeometricGrid />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              {lt.valTitle}
            </h2>
            <div className="h-1 w-16 bg-amber-400 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { t: lt.val1Title, d: lt.val1Desc, i: Landmark },
              { t: lt.val2Title, d: lt.val2Desc, i: ShieldCheck },
              { t: lt.val3Title, d: lt.val3Desc, i: Zap },
              { t: lt.val4Title, d: lt.val4Desc, i: Sparkles }
            ].map((card, idx) => {
              const Icon = card.i;
              return (
                <div 
                  key={idx} 
                  className="bg-[#071A35]/60 backdrop-blur-md border border-slate-750/50 p-6 rounded-2xl hover:border-amber-400/40 hover:-translate-y-1.5 transition-all duration-300 text-left space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div className="p-3 bg-[#0C2547] border border-slate-700/60 rounded-xl text-amber-400 w-fit shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-tight">{card.t}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{card.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION (DEEP NAVY GRADIENT) */}
      <section 
        id="how-it-works" 
        className="relative overflow-hidden w-full py-16 sm:py-24 bg-gradient-to-b from-[#071A35] to-[#091F3E] border-b border-slate-800/60"
      >
        <GeometricGrid />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              {lt.howTitle}
            </h2>
            <p className="text-xs text-amber-400 font-mono tracking-wider font-bold">
              {lt.howSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {[
              { num: "01", t: lt.step1Title, d: lt.step1Desc },
              { num: "02", t: lt.step2Title, d: lt.step2Desc },
              { num: "03", t: lt.step3Title, d: lt.step3Desc },
              { num: "04", t: lt.step4Title, d: lt.step4Desc }
            ].map((step, idx) => (
              <div 
                key={idx} 
                className="text-center space-y-4 relative z-10 bg-[#0C2547]/40 backdrop-blur-sm p-6 rounded-2xl border border-slate-800/60 shadow-lg"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#071A35] border border-slate-700/50 text-amber-400 font-black flex items-center justify-center mx-auto text-sm shadow-md font-mono">
                  {step.num}
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">{step.t}</h3>
                <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed font-medium">
                  {step.d}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800/60 pt-6 text-center max-w-xl mx-auto">
            <p className="text-xs text-slate-400 font-mono">
              ⚠️ <strong>{language === 'en' ? 'Transparency Note:' : 'ملاحظة الشفافية:'}</strong> {lt.howNote}
            </p>
          </div>
        </div>
      </section>

      {/* 4. ABOUT SARIREMIT (SLIGHTLY LIGHTER NAVY GRADIENT) */}
      <section 
        id="about" 
        className="relative overflow-hidden w-full py-16 sm:py-24 bg-gradient-to-b from-[#0C2547] to-[#0A203F] border-b border-slate-800/60"
      >
        <GeometricGrid />
        <SaudiSkyline />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">ABOUT OUR WORK</span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
                {lt.aboutTitle}
              </h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {lt.aboutBody}
            </p>
            <div className="p-4 bg-[#071A35]/80 backdrop-blur-sm border border-slate-800/60 rounded-2xl text-xs text-amber-300 leading-relaxed font-semibold italic">
              " {lt.aboutFounder} "
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[#071A35]/60 backdrop-blur-md border border-slate-750/50 p-6 rounded-2xl space-y-4 text-left">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl w-fit">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest">{lt.missionTitle}</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {lt.mission}
              </p>
            </div>

            <div className="bg-[#071A35]/60 backdrop-blur-md border border-slate-750/50 p-6 rounded-2xl space-y-4 text-left">
              <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl w-fit">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest">{lt.visionTitle}</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {lt.vision}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY SARIREMIT (DEEP NAVY GRADIENT) */}
      <section 
        id="why-sariremit" 
        className="relative overflow-hidden w-full py-16 sm:py-24 bg-gradient-to-b from-[#071A35] to-[#091E3B] border-b border-slate-800/60"
      >
        <GeometricGrid />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              {lt.whyTitle}
            </h2>
            <div className="h-1 w-16 bg-amber-400 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { t: lt.why1Title, d: lt.why1Desc, i: HeartHandshake },
              { t: lt.why2Title, d: lt.why2Desc, i: ShieldCheck },
              { t: lt.why3Title, d: lt.why3Desc, i: Info },
              { t: lt.why4Title, d: lt.why4Desc, i: CheckCircle2 },
              { t: lt.why5Title, d: lt.why5Desc, i: Zap },
              { t: lt.why6Title, d: lt.why6Desc, i: FileText }
            ].map((feat, idx) => {
              const Icon = feat.i;
              return (
                <div 
                  key={idx} 
                  className="bg-[#0C2547]/50 backdrop-blur-sm border border-slate-750/50 p-6 rounded-2xl text-left hover:border-amber-400/30 transition-all duration-300 flex gap-4 shadow-lg"
                >
                  <div className="p-2.5 bg-[#071A35] border border-slate-700/50 text-amber-400 rounded-xl shrink-0 h-fit">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wide">{feat.t}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{feat.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. TRUST & TRANSPARENCY SECTION (SLIGHTLY LIGHTER NAVY GRADIENT) */}
      <section 
        id="trust" 
        className="relative overflow-hidden w-full py-16 sm:py-24 bg-gradient-to-b from-[#0C2547] to-[#0A203F] border-b border-slate-800/60"
      >
        <GeometricGrid />
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">TRANSPARENCY CHARTER</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
              {lt.trustTitle}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {lt.trustSub}
            </p>
            
            <div className="p-4 bg-[#071A35]/60 border border-emerald-500/20 rounded-2xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block tracking-wider">Independent Policy</span>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {lt.trustPolicy}
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#071A35]/80 backdrop-blur-lg border border-slate-700/50 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl">
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider border-b border-slate-800/60 pb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow animate-pulse" />
              {lt.trustCardTitle}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                lt.trustPoint1, lt.trustPoint2, lt.trustPoint3, 
                lt.trustPoint4, lt.trustPoint5, lt.trustPoint6, 
                lt.trustPoint7
              ].map((point, index) => (
                <div key={index} className="flex items-start gap-2 text-xs font-semibold text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800/60 pt-4 text-left">
              <p className="text-[11px] text-slate-400 font-mono italic">
                ⚠️ {lt.trustUncertainty}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRODUCT EXPERIENCE (DEEP NAVY GRADIENT) */}
      <section className="relative overflow-hidden w-full py-16 sm:py-24 bg-gradient-to-b from-[#071A35] to-[#0A2244] border-b border-slate-800/60">
        <GeometricGrid />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              {lt.expTitle}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {lt.expSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Mock 1: Mobile Home Rec */}
            <div className="bg-[#0C2547]/60 backdrop-blur-md border border-slate-750/50 p-5 rounded-2xl text-left space-y-4 shadow-lg">
              <span className="text-[9px] font-mono font-bold text-amber-400 uppercase">{lt.expMock1}</span>
              <div className="bg-[#071A35]/90 border border-slate-800/60 rounded-xl p-3.5 space-y-2.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>STC Pay</span>
                  <span className="text-emerald-400">● 98% Conf</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-white">Best Rate: 1 SAR = 74.2 PKR</div>
                <div className="text-[9px] text-slate-300 font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded w-fit font-bold border border-emerald-500/25">RECOMMENDED</div>
              </div>
            </div>

            {/* Mock 2: Rate Comparison View */}
            <div className="bg-[#0C2547]/60 backdrop-blur-md border border-slate-750/50 p-5 rounded-2xl text-left space-y-4 shadow-lg">
              <span className="text-[9px] font-mono font-bold text-amber-400 uppercase">{lt.expMock2}</span>
              <div className="bg-[#071A35]/90 border border-slate-800/60 rounded-xl p-3.5 space-y-2">
                <div className="grid grid-cols-3 text-[9px] font-mono font-bold text-slate-400 border-b border-slate-800/60 pb-1">
                  <span>WALLET</span>
                  <span>RATE</span>
                  <span className="text-right">FEE</span>
                </div>
                <div className="grid grid-cols-3 text-[10px] font-bold text-slate-200">
                  <span>UrPay</span>
                  <span>74.15</span>
                  <span className="text-right text-amber-400 font-mono">10 SAR</span>
                </div>
                <div className="grid grid-cols-3 text-[10px] font-bold text-slate-200">
                  <span>Enjaz</span>
                  <span>73.90</span>
                  <span className="text-right text-amber-400 font-mono">15 SAR</span>
                </div>
              </div>
            </div>

            {/* Mock 3: Savings Ledger */}
            <div className="bg-[#0C2547]/60 backdrop-blur-md border border-slate-750/50 p-5 rounded-2xl text-left space-y-4 shadow-lg">
              <span className="text-[9px] font-mono font-bold text-amber-400 uppercase">{lt.expMock3}</span>
              <div className="bg-[#071A35]/90 border border-slate-800/60 rounded-xl p-3.5 space-y-2 text-center">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block">Total Savings Saved</span>
                <div className="text-lg font-mono font-black text-emerald-400">SAR 240.50</div>
                <div className="text-[9px] text-slate-300">Over 8 recorded transfers</div>
              </div>
            </div>

            {/* Mock 4: Verify Receipt */}
            <div className="bg-[#0C2547]/60 backdrop-blur-md border border-slate-750/50 p-5 rounded-2xl text-left space-y-4 shadow-lg">
              <span className="text-[9px] font-mono font-bold text-amber-400 uppercase">{lt.expMock4}</span>
              <div className="bg-[#071A35]/90 border border-slate-800/60 rounded-xl p-3.5 space-y-2">
                <div className="w-full h-12 bg-[#0C2547]/50 border-2 border-dashed border-slate-700/60 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-bold">
                  receipt_stc.png
                </div>
                <span className="text-[9px] text-amber-400 font-bold uppercase block text-center tracking-wide">⏳ PENDING VERIFICATION</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. COMMUNITY VERIFICATION (SLIGHTLY LIGHTER NAVY GRADIENT) */}
      <section className="relative overflow-hidden w-full py-16 sm:py-24 bg-gradient-to-b from-[#0C2547] to-[#0A203F] border-b border-slate-800/60">
        <GeometricGrid />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              {lt.commTitle}
            </h2>
            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
              {lt.commBody}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center relative max-w-4xl mx-auto">
            {[
              { step: "1", label: lt.commS1, color: "text-amber-400" },
              { step: "2", label: lt.commS2, color: "text-amber-400" },
              { step: "3", label: lt.commS3, color: "text-emerald-400" },
              { step: "4", label: lt.commS4, color: "text-emerald-400" }
            ].map((flow, index) => (
              <div 
                key={index} 
                className="bg-[#071A35]/70 border border-slate-750/50 p-6 rounded-2xl space-y-3 relative shadow-lg"
              >
                <span className={`text-xl font-mono font-black ${flow.color}`}>{flow.step}</span>
                <p className="text-xs font-bold text-white uppercase tracking-wider">{flow.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. SAVINGS ILLUSTRATION MODULE (DEEP NAVY GRADIENT) */}
      <section className="relative overflow-hidden w-full py-16 sm:py-24 bg-gradient-to-b from-[#071A35] to-[#091F3E] border-b border-slate-800/60">
        <GeometricGrid />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 text-left">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
              {lt.saveTitle}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {lt.saveBody}
            </p>
          </div>

          <div className="lg:col-span-6 bg-[#0C2547]/80 backdrop-blur-lg border border-slate-700/50 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">{lt.saveMockTitle}</h3>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{lt.saveLabel}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#071A35] p-4 rounded-xl text-left border border-slate-800/60 shadow-inner">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{lt.saveM1}</span>
                <span className="text-lg sm:text-xl font-mono font-black text-emerald-400">SAR 120.00</span>
              </div>
              <div className="bg-[#071A35] p-4 rounded-xl text-left border border-slate-800/60 shadow-inner">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{lt.saveM2}</span>
                <span className="text-lg sm:text-xl font-mono font-black text-emerald-400">SAR 840.50</span>
              </div>
              <div className="bg-[#071A35] p-4 rounded-xl text-left border border-slate-800/60 shadow-inner">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{lt.saveM3}</span>
                <span className="text-sm sm:text-base font-mono font-black text-white">12 Transfers</span>
              </div>
              <div className="bg-[#071A35] p-4 rounded-xl text-left border border-slate-800/60 shadow-inner">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{lt.saveM4}</span>
                <span className="text-sm sm:text-base font-mono font-black text-white">2 Corridors</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. RESPONSIBLE POSITIONING (SLIGHTLY LIGHTER NAVY GRADIENT) */}
      <section className="relative overflow-hidden w-full py-16 sm:py-24 bg-gradient-to-b from-[#0C2547] to-[#0A203F] border-b border-slate-800/60">
        <GeometricGrid />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              {lt.respTitle}
            </h2>
            <div className="h-1 w-16 bg-amber-400 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#061c21]/80 backdrop-blur-sm border border-emerald-500/20 p-6 sm:p-8 rounded-3xl space-y-6 text-left shadow-lg">
              <h3 className="text-lg font-black text-emerald-400 uppercase tracking-tight flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {lt.respIs}
              </h3>
              <ul className="space-y-3">
                {[lt.respIs1, lt.respIs2, lt.respIs3, lt.respIs4].map((item, idx) => (
                  <li key={idx} className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#1d1215]/80 backdrop-blur-sm border border-rose-500/20 p-6 sm:p-8 rounded-3xl space-y-6 text-left shadow-lg">
              <h3 className="text-lg font-black text-rose-400 uppercase tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {lt.respIsNot}
              </h3>
              <ul className="space-y-3">
                {[lt.respIsNot1, lt.respIsNot2, lt.respIsNot3, lt.respIsNot4, lt.respIsNot5].map((item, idx) => (
                  <li key={idx} className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-4 text-center max-w-2xl mx-auto border-t border-slate-800/60">
            <p className="text-[11px] text-slate-400 font-mono italic">
              ⚠️ {lt.respDisclaimer}
            </p>
          </div>
        </div>
      </section>

      {/* 11. FAQ SECTION ACCORDION (DEEP NAVY GRADIENT) */}
      <section 
        id="faq" 
        className="relative overflow-hidden w-full py-16 sm:py-24 bg-gradient-to-b from-[#071A35] to-[#0A2244] border-b border-slate-800/60"
      >
        <GeometricGrid />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              {lt.faqTitle}
            </h2>
            <div className="h-1 w-16 bg-amber-400 mx-auto rounded-full" />
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isExpanded = expandedFaq === index;
              const question = language === 'en' ? faq.qEn : faq.qAr;
              const answer = language === 'en' ? faq.aEn : faq.aAr;
              return (
                <div 
                  key={index} 
                  className="bg-[#0C2547]/60 backdrop-blur-sm border border-slate-750/50 rounded-xl overflow-hidden shadow-md transition-all duration-200"
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between text-slate-200 hover:text-white font-bold text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                    aria-expanded={isExpanded}
                  >
                    <span className={isRtl ? 'text-right w-full block' : ''}>{question}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="p-5 pt-0 border-t border-slate-800/60 bg-[#071A35]/80 text-xs text-slate-300 leading-relaxed font-medium">
                      <p className={isRtl ? 'text-right' : 'text-left'}>{answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 12. FINAL CALL TO ACTION (SLIGHTLY LIGHTER NAVY GRADIENT) */}
      <section className="relative overflow-hidden w-full py-16 sm:py-28 bg-gradient-to-b from-[#0C2547] to-[#0A203F] border-b border-slate-800/60">
        <GeometricGrid />
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10 space-y-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
            {lt.finalTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
            {lt.finalSub}
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            {/* Primary Action is Green */}
            <SDSButton
              onClick={() => handleStartComparing()}
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase px-8 py-4 rounded-xl shadow-lg w-full sm:w-auto transition-all duration-300"
            >
              {lt.finalCtaPrimary}
            </SDSButton>
            
            {/* Secondary Action has clear styling without drawing focus */}
            <SDSButton
              onClick={() => setActiveTab('sign-up')}
              variant="secondary"
              className="bg-[#071A35] border border-slate-700 text-slate-200 hover:bg-[#071A35]/80 font-extrabold text-xs tracking-wider uppercase px-8 py-4 rounded-xl w-full sm:w-auto"
            >
              {lt.finalCtaSecondary}
            </SDSButton>
          </div>

          <p className="text-[10px] text-slate-400 max-w-lg mx-auto font-mono">
            {lt.finalHelper}
          </p>
        </div>
      </section>

      {/* 13. CONTACT SECTION (DEEP NAVY GRADIENT TRANSITIONING TO FOOTER shade #04111F) */}
      <section 
        id="contact" 
        className="relative overflow-hidden w-full py-16 sm:py-24 bg-gradient-to-b from-[#071A35] to-[#04111F]"
      >
        <GeometricGrid />
        <SaudiSkyline />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
              {lt.contactTitle}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {lt.contactSub}
            </p>
          </div>

          <div className="space-y-6 bg-[#0C2547]/50 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-slate-750/50 shadow-xl">
            <div className="text-xs text-amber-300 font-mono bg-amber-400/5 p-4 rounded-xl border border-amber-400/10 text-center font-bold">
              📝 {lt.contactFormNote}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SDSInput label={language === 'en' ? 'Your Name' : 'الاسم'} placeholder="Hassan Ahmed" disabled />
              <SDSInput label={language === 'en' ? 'Email Address' : 'البريد الإلكتروني'} placeholder="hassan@example.com" disabled />
            </div>
            <SDSInput label={language === 'en' ? 'Subject' : 'الموضوع'} placeholder="Corridor Enquiry" disabled />
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-300 block">{language === 'en' ? 'Your Message' : 'رسالتك'}</label>
              <textarea 
                rows={4} 
                className="w-full bg-[#071A35]/90 border border-slate-700 rounded-xl p-3 text-xs text-slate-400 cursor-not-allowed" 
                placeholder="Your inquiry message..." 
                disabled
              />
            </div>

            <div className="flex justify-end">
              <SDSButton disabled variant="secondary" className="opacity-50 cursor-not-allowed bg-slate-800/20 border-slate-750 text-slate-400">
                {lt.contactBtn}
              </SDSButton>
            </div>

            <div className="border-t border-slate-800/60 pt-6 text-center space-y-3">
              <p className="text-xs text-slate-300 font-medium">
                📬 {lt.contactDirect}
              </p>
              <div className="flex justify-center gap-4 text-xs font-bold">
                <a href="mailto:support@sariremit.com" className="text-emerald-400 hover:underline flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  support@sariremit.com
                </a>
                <span className="text-slate-700">|</span>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-amber-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Report an Issue
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
