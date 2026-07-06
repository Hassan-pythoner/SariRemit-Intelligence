import React, { useState } from 'react';
import { X, ShieldCheck, Landmark, Lock, HelpCircle, FileText, Scale } from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'en' | 'ar'>(language);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in"
      id="terms-conditions-overlay"
    >
      {/* Modal Container */}
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-4xl w-full rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        id="terms-conditions-dialog"
      >
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/10 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-sans">
                {activeTab === 'en' ? 'Terms & Conditions of Use' : 'الشروط والأحكام الخاصة بالاستخدام'}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {activeTab === 'en' ? 'SariRemit Compliance Platform' : 'منصة ساري ريميت المتوافقة'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Toggle Inside Modal */}
            <div className="bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg flex">
              <button
                onClick={() => setActiveTab('en')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all ${
                  activeTab === 'en' 
                    ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setActiveTab('ar')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all font-sans ${
                  activeTab === 'ar' 
                    ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                العربية
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
              aria-label="Close modal"
              id="close-terms-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-h-[60vh]">
          
          {/* Quick Summary Highlights Bar */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-4 rounded-xl space-y-2.5">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4.5 h-4.5 text-green-600 dark:text-green-500" />
              <span>{activeTab === 'en' ? 'Important Regulatory Notices' : 'تنويهات تنظيمية هامة'}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="flex gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800">
                <Landmark className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p>
                  {activeTab === 'en' 
                    ? 'Non-SAMA Licensed: We are an informational comparison engine. We do not transfer funds or execute payments.' 
                    : 'غير مرخص من ساما: نحن محرك مقارنة معلوماتي فقط، ولا نقوم بنقل الأموال أو تنفيذ عمليات الدفع.'}
                </p>
              </div>
              <div className="flex gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800">
                <Lock className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p>
                  {activeTab === 'en' 
                    ? 'KSA PDPL Compliant: Your personal profile, emails, and phone alerts are fully protected under Saudi Data Protection laws.' 
                    : 'متوافق مع نظام حماية البيانات (PDPL): ملفك الشخصي وبريدك وتنبيهاتك محمية تماماً بموجب الأنظمة السعودية.'}
                </p>
              </div>
              <div className="flex gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800">
                <ShieldCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p>
                  {activeTab === 'en'
                    ? 'Real-Time Verification: We process device telemetry & cache signals to diagnose and resolve rate variances across corridors instantly.'
                    : 'تحقق في الوقت الفعلي: نقوم بمعالجة بيانات الأجهزة وإشارات التخزين المؤقت لتشخيص وحل تباينات أسعار الصرف فوراً.'}
                </p>
              </div>
            </div>
          </div>

          {activeTab === 'en' ? (
            /* ENGLISH VERSION */
            <div className="space-y-6 text-slate-700 dark:text-slate-300">
              
              <section className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-green-600">1.</span> Welcome to SariRemit
                </h3>
                <p>
                  These Terms and Conditions govern your access to and use of the <strong>SariRemit Platform</strong>. By accessing, logging in, registering, or using the platform, you unconditionally agree to comply with and be bound by these Terms, as well as all applicable laws, regulations, and circulars of the <strong>Kingdom of Saudi Arabia (KSA)</strong>.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-green-600">2.</span> SAMA Regulatory Alignment & Financial Disclaimer
                </h3>
                <p>
                  In alignment with the directives of the <strong>Saudi Central Bank (SAMA)</strong> regarding digital financial advisory and comparison services:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <li><strong>Informational Comparison Tool:</strong> SariRemit acts strictly as an independent directory and price-comparison engine. We are <strong>not</strong> a bank, currency exchange outlet, or payment service provider (PSP).</li>
                  <li><strong>No Fund Execution:</strong> We do not receive, hold, transmit, custody, or convert any customer funds. Any money-transfer activities are initiated and executed directly by you through SAMA-licensed remittance providers (e.g., stc pay, urpay, Mobily Pay, Enjaz, Tahweel Al Rajhi).</li>
                  <li><strong>Accuracy of Information:</strong> Exchange rates and fees displayed on SariRemit are community-crowdsourced, estimated via reference API metrics, or uploaded periodically. While we strive for accuracy, the market fluctuates rapidly. SAMA licensed entities have exclusive final authority on execution rates. You must confirm current rates on your preferred provider's official app before finalizing any transfer.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-green-600">3.</span> Saudi Personal Data Protection Law (PDPL) Compliance & Client Diagnostics
                </h3>
                <p>
                  We are deeply committed to protecting the privacy of expatriates and citizens within KSA under the <strong>Saudi Personal Data Protection Law (PDPL)</strong> issued under Royal Decree No. M/147:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <li><strong>Consent:</strong> By registering an account or configuring target exchange rate alerts, you consent to the storage of your email, phone number, and corridor preferences.</li>
                  <li><strong>Security Measures:</strong> We employ standard encryption protocols and local database security keys to prevent unauthorized access, disclosure, or alteration of your personal data.</li>
                  <li><strong>User Rights:</strong> You retain the absolute right to view, modify, export, or permanently request the deletion of your account and personal history directly from the Profile tab. We do not lease, trade, or share your data with unauthorized third parties.</li>
                  <li><strong>Real-Time Signal Verification & Diagnostics:</strong> To diagnose multi-device rate divergence issues (such as different rate displays across mobile/desktop or cached variances in corridors like Kenya), the platform logs approximate client device characteristics, browser user agents, request latency, and local storage overrides. Authorized administrative accounts may send force-sync signals to purge stale client browser caches to keep everyone synchronized. No identity or biometric data is stored during signal diagnostics.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-green-600">4.</span> Anti-Cybercrime & Acceptable Use
                </h3>
                <p>
                  In compliance with the <strong>Saudi Anti-Cybercrime Law</strong> (Royal Decree No. M/17):
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <li><strong>Fraudulent Submissions:</strong> You are strictly prohibited from submitting deliberately false, highly inaccurate, or manipulative exchange rates with the intent of misleading the expat community.</li>
                  <li><strong>System Integrity:</strong> Any attempt to inject malicious code, harvest data via scraping, or execute Denial of Service (DoS) attacks on SariRemit is a severe offense. Violators will be reported immediately to the <strong>National Cybersecurity Authority (NCA)</strong> and KSA public prosecutors.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-green-600">5.</span> Intellectual Property & Descriptive Fair Use
                </h3>
                <p>
                  All commercial logos, trademarks, and brand titles shown on SariRemit (including but not limited to <em>stc pay, urpay, Mobily Pay, Enjaz, Tahweel Al Rajhi, QuickPay, and Western Union</em>) are the exclusive properties of their respective registered owners and financial institutions. SariRemit displays these marks under <strong>Fair Use</strong> principles strictly for descriptive and comparative purposes to help consumers recognize remittance choices. There is no official sponsorship, endorsement, or business affiliation.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-green-600">6.</span> Limitation of Liability
                </h3>
                <p>
                  To the maximum extent permitted by Saudi regulations, SariRemit, its developers, and community maintainers shall not be held liable for any financial losses, transfer delays, transaction failures, or extra banking fees incurred as a result of using this comparison application. The final choice of remittance and accuracy checks lies solely with the end-user.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-green-600">7.</span> Jurisdiction & Applicable Law
                </h3>
                <p>
                  These Terms and Conditions shall be governed, interpreted, and enforced in accordance with the laws and regulations of the <strong>Kingdom of Saudi Arabia</strong>. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in Riyadh, KSA.
                </p>
              </section>

            </div>
          ) : (
            /* ARABIC VERSION */
            <div className="space-y-6 text-slate-700 dark:text-slate-300 text-right dir-rtl font-sans" dir="rtl">
              
              <section className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 justify-start">
                  <span className="text-green-600">١.</span> أهلاً بكم في منصة ساري ريميت (SariRemit)
                </h3>
                <p>
                  تحكم هذه الشروط والأحكام استخدامكم لمنصة <strong>ساري ريميت</strong>. بدخولكم للمنصة، أو التسجيل فيها، أو استخدام خدماتها، فإنكم توافقون دون قيد أو شرط على الالتزام الكامل بهذه الشروط وكافة الأنظمة والتعليمات والتعاميم السارية في <strong>المملكة العربية السعودية</strong>.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 justify-start">
                  <span className="text-green-600">٢.</span> التوافق التنظيمي مع تعليمات البنك المركزي السعودي (ساما) وإخلاء المسؤولية المالي
                </h3>
                <p>
                  تماشياً مع توجيهات وتعميمات <strong>البنك المركزي السعودي (SAMA)</strong> بخصوص الخدمات والحلول المالية الاستشارية ومقارنة الأسعار:
                </p>
                <ul className="list-disc pr-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <li><strong>أداة معلوماتية للمقارنة:</strong> يعمل تطبيق ساري ريميت كدليل ومحرك مستقل لمقارنة أسعار الصرف والرسوم فقط. نحن <strong>لسنا</strong> بنكاً، ولا شركة صرافة، ولا مقدم خدمات دفع معتمد.</li>
                  <li><strong>عدم تنفيذ الحوالات المباشرة:</strong> نحن لا نستلم، ولا نحتفظ، ولا نقوم بنقل، أو تحويل أي أموال تخص المستخدمين. كافة العمليات المالية يتم البدء بها وتنفذ من قبلكم مباشرة عبر قنوات ومؤسسات التحويل المرخصة من "ساما" (مثل: stc pay، urpay، Mobily Pay، إنجاز، تحويل الراجحي).</li>
                  <li><strong>دقة الأسعار المعروضة:</strong> يتم جمع أسعار الصرف والرسوم في التطبيق عبر مساهمات مجتمعية أو استعلامات مرجعية دورية. على الرغم من سعينا الدائم للدقة، إلا أن أسعار الصرف تتقلب بسرعة بالغة. تظل الجهات والمنصات المالية المرخصة هي المرجع الفيدرالي والوحيد لتحديد السعر الفعلي المطبق وقت إرسال الحوالة. يتوجب عليكم دائماً التحقق من السعر عبر التطبيق الرسمي للبنك أو المحفظة قبل إجراء التحويل.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 justify-start">
                  <span className="text-green-600">٣.</span> التوافق مع نظام حماية البيانات الشخصية السعودي (PDPL) وتشخيصات الأجهزة
                </h3>
                <p>
                  نلتزم التزاماً صارماً بحماية خصوصية بيانات كافة المغتربين والمواطنين داخل المملكة بموجب <strong>نظام حماية البيانات الشخصية الصادر بالمرسوم الملكي رقم (م/١٤٧)</strong>:
                </p>
                <ul className="list-disc pr-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <li><strong>الموافقة المستنيرة:</strong> بتسجيلكم في المنصة أو تفعيل تنبيهات الأسعار، فإنكم تمنحون الموافقة الصريحة لتخزين وحفظ بريدكم الإلكتروني، رقم الجوال، وتفضيلات العملات الخاصة بكم لمساعدتكم.</li>
                  <li><strong>أمن البيانات:</strong> نطبق أعلى معايير التشفير والبروتوكولات الأمنية لحماية البيانات من الوصول غير المصرح به أو تعديلها أو كشفها.</li>
                  <li><strong>حقوق المستخدم:</strong> تتمتعون بالحق الكامل في استعراض بياناتكم، تعديلها، أو طلب الحذف النهائي لكامل الحساب والبيانات التاريخية مباشرة من صفحة الملف الشخصي. لا نقوم ببيع أو تأجير أو مشاركة بياناتكم مع أي جهات خارجية غير مصرحة.</li>
                  <li><strong>التحقق والتشخيص الفوري للإشارات:</strong> لتشخيص مشاكل تباين الأسعار بين الأجهزة المختلفة (مثل اختلاف عرض الأسعار بين الجوال والكمبيوتر أو وجود بيانات مؤقتة تالفة لممرات مثل كينيا)، تسجل المنصة بيانات تقريبية عن الجهاز، ونوع المتصفح، وزمن استجابة الطلبات، والتعديلات المحلية المخزنة. كما يمكن للحسابات الإدارية إرسال إشارات فرض المزامنة لمسح التخزين المؤقت التالف لأجهزة العملاء وضمان اتساق الأسعار للجميع. لا يتم حفظ أو جمع أي بيانات حيوية أو شخصية حساسة خلال هذه العملية.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 justify-start">
                  <span className="text-green-600">٤.</span> نظام مكافحة جرائم المعلوماتية والاستخدام المقبول
                </h3>
                <p>
                  بموجب <strong>نظام مكافحة جرائم المعلوماتية السعودي</strong> الصادر بالمرسوم الملكي رقم (م/١٧):
                </p>
                <ul className="list-disc pr-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <li><strong>البيانات المضللة والزائفة:</strong> يمنع منعاً باتاً إدخال أو رفع أسعار صرف غير صحيحة أو مضللة بشكل متعمد بغرض خداع مجتمع المغتربين.</li>
                  <li><strong>سلامة الأنظمة والموقع:</strong> يحظر محاولة اختراق الموقع، أو حقن برمجيات خبيثة، أو تنفيذ هجمات حجب الخدمة (DoS). سيتم اتخاذ الإجراءات القانونية فوراً ورفع التقارير للهيئة الوطنية للأمن السيبراني (NCA) والنيابة العامة بالمملكة لملاحقة المخالفين.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 justify-start">
                  <span className="text-green-600">٥.</span> الملكية الفكرية والاستخدام العادل للعلامات التجارية
                </h3>
                <p>
                  كافة العلامات التجارية، والشعارات، والأسماء التجارية للشركات والجهات المالية المعروضة في ساري ريميت (بما في ذلك على سبيل المثال لا الحصر: <em>stc pay، urpay، Mobily Pay، إنجاز، تحويل الراجحي، كويك باي، وويسترن يونيون</em>) هي ملكية حصرية لمالكيها المسجلين ومؤسساتهم المصرفية. يعرض ساري ريميت هذه الشعارات كأداة تعريفية للمقارنة فقط بناءً على مبدأ <strong>الاستخدام العادل (Fair Use)</strong> لتسهيل تعرف المستخدم على خيارات التحويل، دون أي رعاية أو شراكة رسمية مع هذه الجهات.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 justify-start">
                  <span className="text-green-600">٦.</span> تحديد المسؤولية القانونية والمالية
                </h3>
                <p>
                  بالحد الأقصى الذي تسمح به الأنظمة والقوانين السارية في المملكة العربية السعودية، لا يتحمل تطبيق ساري ريميت أو مطوروه أو المساهمون فيه أي مسؤولية تجاه أي خسائر مالية، تأخير في التحويلات، فشل المعاملات المصرفية، أو رسوم إضافية قد يفرضها البنك المستلم. يقع قرار اختيار جهة التحويل والتحقق من الأسعار على عاتق المستخدم النهائي وحده.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 justify-start">
                  <span className="text-green-600">٧.</span> الاختصاص القضائي والقوانين السارية
                </h3>
                <p>
                  تخضع هذه الشروط والأحكام وتفسر وتطبق بموجب الأنظمة والقوانين المرعية في <strong>المملكة العربية السعودية</strong>. وتختص الجهات القضائية والمحاكم المختصة بمدينة الرياض حصراً بالنظر في أي نزاع قد ينشأ عن استخدام هذا التطبيق أو الشروط المذكورة.
                </p>
              </section>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center flex-wrap gap-3">
          <p className="text-[10px] text-slate-400 font-mono">
            {activeTab === 'en' ? 'Last Updated: June 2026 (v2.2 - Compliance & Diagnostics)' : 'آخر تحديث: ذو الحجة ١٤٤٧هـ / يونيو ٢٠٢٦م (النسخة ٢.٢ - تشخيصات التزامن)'}
          </p>
          <button
            onClick={onClose}
            className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
            id="accept-terms-close-btn"
          >
            {activeTab === 'en' ? 'I Understand & Accept' : 'فهمت وأوافق'}
          </button>
        </div>

      </div>
    </div>
  );
};
