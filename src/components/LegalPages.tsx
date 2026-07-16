import React from 'react';
import { ArrowLeft, ArrowRight, Shield, FileText, AlertTriangle, CheckSquare, RefreshCw } from 'lucide-react';
import { SDSButton } from './Sds';

interface LegalPagesProps {
  pageType: 'privacy-policy' | 'terms-of-use' | 'disclaimer' | 'community-verification-policy' | 'rate-update-policy';
  setActiveTab: (tab: string) => void;
  language: 'en' | 'ar';
}

export default function LegalPages({ pageType, setActiveTab, language }: LegalPagesProps) {
  const isRtl = language === 'ar';

  const content = {
    'privacy-policy': {
      titleEn: "Privacy Policy",
      titleAr: "سياسة الخصوصية",
      icon: Shield,
      lastUpdatedEn: "Last updated: July 15, 2026 (v1.2)",
      lastUpdatedAr: "آخر تحديث: ١٥ يوليو ٢٠٢٦ (إصدار ١.٢)",
      renderEn: () => (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
          <div className="p-4 bg-emerald-50/60 border-l-4 border-emerald-500 rounded-xl text-emerald-950 text-xs font-semibold">
            This Privacy Policy has been written specifically for SariRemit and is fully aligned with the Saudi Arabia Personal Data Protection Law (PDPL) issued by Royal Decree No. (M/19). It describes how we collect, process, and safeguard your personal information when you use our platform.
          </div>

          <p className="font-semibold text-slate-900 text-base">
            At SariRemit, we prioritize the privacy and security of our community members, especially the hardworking expatriates in Saudi Arabia. Protecting your personal information is one of our absolute core principles. We aim to keep your data safe and explain our practices in simple, plain English without confusing legal jargon.
          </p>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">1. Introduction</h3>
            <p>
              SariRemit is an independent decision-support platform designed to help expatriates compare different remittance channels (such as banks, digital wallets, and money transfer operators), estimate their transaction savings, and make informed remittance decisions. We do not process transactions or hold money. Protecting your data and respecting your privacy is a foundation of everything we build.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">2. Information We Collect</h3>
            <p>
              We collect only the essential information required to offer our comparison services, maintain security, and allow community contributions. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account Information:</strong> Your full name, email address, phone number (such as a KSA mobile number), preferred language, default destination country, and secure authentication credentials.
              </li>
              <li>
                <strong>Profile Information:</strong> Your custom preferences, saved transfer corridors, and alert notifications preferences.
              </li>
              <li>
                <strong>Transfer Records:</strong> Historical recorded transfers, estimated transaction savings, and transfer dates you log inside your private dashboard to monitor your savings history.
              </li>
              <li>
                <strong>Community Rate Submissions:</strong> Exchange rate values, transfer fees, destination currencies, and any screenshots of wallet quotes or remittance receipts you voluntarily upload to verify community rates.
              </li>
              <li>
                <strong>Support Requests:</strong> Support tickets, feedback submissions, email correspondence, and any document attachments you submit to resolve operational issues.
              </li>
              <li>
                <strong>Technical Information:</strong> Secure browser headers, device attributes, IP address, session identifiers, security log files, and cookies.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">3. Why We Collect Information</h3>
            <p>
              Your personal information is processed strictly for clear, legitimate purposes:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>To register your profile and securely authenticate you upon login.</li>
              <li>To allow comparing active remittance providers and estimating custom savings.</li>
              <li>To generate personalized remittance corridor recommendations.</li>
              <li>To verify user-submitted community rates and audit screenshots.</li>
              <li>To protect the platform against fraud, system abuse, and malicious rate seeding.</li>
              <li>To distribute requested notifications (such as rate updates and achievement progress).</li>
              <li>To respond to your support queries and compliance requests.</li>
              <li>To maintain audit trails of administrative activities to ensure compliance.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">4. Legal Basis for Processing</h3>
            <p>
              In accordance with the Saudi Personal Data Protection Law (PDPL), we only process your personal data under valid legal grounds:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Your Consent:</strong> When you register an account and choose to share optional preferences or community submissions, or accept notifications.
              </li>
              <li>
                <strong>Performance of Services:</strong> Processing necessary to provide you with the comparative calculations, savings analysis, and recommendations you request.
              </li>
              <li>
                <strong>Legitimate Operations & Anti-Fraud:</strong> Processing necessary for our legitimate interests to secure the platform, verify submissions, prevent fraud, and maintain compliance, provided these do not override your privacy rights.
              </li>
              <li>
                <strong>Legal Obligations:</strong> Compliance with any official regulations or regulatory authorities operating within the Kingdom of Saudi Arabia.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">5. How We Protect Information</h3>
            <p>
              To keep your data safe, we implement the **SariRemit Security & Audit Framework (SAF)** which incorporates robust, industry-standard protections:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Encryption:</strong> All data is encrypted both while travelling across the internet (TLS/SSL encryption) and when stored on our secure servers.
              </li>
              <li>
                <strong>Secure Authentication:</strong> Multi-factor capabilities and protected session tokens handled via Supabase Auth services.
              </li>
              <li>
                <strong>Row Level Security (RLS):</strong> Granular database filters ensuring that you can only access and modify your own personal transfer records and profile preferences.
              </li>
              <li>
                <strong>Audit Logs & Permissions:</strong> Strict administrator rules and complete logs of all admin changes to protect against unauthorized data views.
              </li>
              <li>
                <strong>Anti-Fraud Screening:</strong> Smart screening filters that inspect submissions without exposing personal credentials.
              </li>
              <li>
                <strong>Screenshot Privacy:</strong> We encourage and process screenshots by stripping or masking non-essential personal names and account numbers during verification.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">6. Who Can Access Your Data</h3>
            <p>
              SariRemit values strict data segregation. Access is restricted under strict rules:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>The User:</strong> You have exclusive, private access to your own personal profile, preferences, and transfer records. No other standard user can see your private data.
              </li>
              <li>
                <strong>SRCMC Admin Staff:</strong> Only verified, authorized administrators can access community submissions or support tickets, strictly to perform audits or resolve tickets. They can never view your plain text password.
              </li>
              <li>
                <strong>The System:</strong> Our Rate Resolution Engine (RRE) and True Cost Engine (TCE) process aggregated data automatically.
              </li>
              <li>
                <strong>No Public Access:</strong> Your individual account details are completely shielded. Only fully anonymized, aggregated rate data is displayed publicly.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">7. Third Party Services</h3>
            <p>
              We integrate only with trusted infrastructure providers that guarantee equal or greater compliance with Saudi data security policies:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Supabase:</strong> Provides our secure user authentication service, hosting for our encrypted database, and storage for community rate verification screenshots.
              </li>
              <li>
                <strong>Future Service Providers:</strong> Any future integrations with specialized email delivery systems, push notification services, or secure diagnostic analytics will be selected carefully and bound by strict confidentiality requirements.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">8. Cookies</h3>
            <p>
              We use standard cookies to make our platform work efficiently:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Essential Cookies:</strong> Cookies used to identify your session, maintain secure logins, and remember your language setting (English or Arabic).
              </li>
              <li>
                <strong>Future Optional Cookies:</strong> Any future non-essential performance or analytics cookies will only be loaded with your explicit permission.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">9. Data Retention</h3>
            <p>
              In line with Saudi PDPL principles, we retain your information only as long as necessary:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Accounts:</strong> Retained while your account remains active. If you request account deletion, we purge or anonymize your personal files.
              </li>
              <li>
                <strong>Transfer History:</strong> Saved to maintain your dashboard statistics, but deleted immediately upon your request.
              </li>
              <li>
                <strong>Community Submissions & Screenshots:</strong> Rates are aggregated. The verification screenshots are permanently destroyed or deleted from storage as soon as the review cycle completes.
              </li>
              <li>
                <strong>Support Tickets:</strong> Kept as active archives to manage support history and quality control.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">10. Your Rights Under Saudi PDPL</h3>
            <p>
              Under the Saudi Personal Data Protection Law, you hold powerful rights over your personal data. You may request:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Right to Know & Access:</strong> Request a description of what data of yours we process and view your records.
              </li>
              <li>
                <strong>Right to Correction:</strong> Request immediate correction of inaccurate, outdated, or incomplete data.
              </li>
              <li>
                <strong>Right to Deletion (Destruction):</strong> Request that your personal records be erased when no longer legally required.
              </li>
              <li>
                <strong>Right to Export:</strong> Download a portable electronic copy of your recorded transfers and profile parameters.
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> Withdraw your consent at any time for features that rely on consent (such as promotional notification alerts).
              </li>
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              *To exercise any of these rights, please write to us directly at support@sariremit.com. We respond to all verified requests promptly.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">11. Children's Privacy</h3>
            <p>
              SariRemit is designed for adults who are sending international remittance transfers from Saudi Arabia. We do not knowingly solicit or collect any personal information from children under the applicable legal age of majority in KSA.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">12. International Users and Data Transfers</h3>
            <p>
              SariRemit is hosted and operated inside Saudi Arabia to serve local residents. When required for cloud routing, secure technical operations, or database backups, some information may be processed using secure partners located globally, under strict contractual protections that maintain PDPL security benchmarks.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">13. Policy Updates</h3>
            <p>
              We may update this Privacy Policy as our features grow or as regulations evolve. If we make significant changes, we will alert you via email, post a notice on our dashboard, or request you to review the updated terms at login. Your continued use of the platform after an update represents agreement.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">14. Contact Us</h3>
            <p>
              If you have any questions, wish to exercise your rights, or want to speak with our compliance desk, please contact our data safety team:
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mt-2">
              <p className="font-bold text-slate-900">SariRemit Legal & Compliance Framework (SLCF)</p>
              <p className="text-xs text-slate-500 mt-0.5">Primary Support: <span className="font-bold text-emerald-650">support@sariremit.com</span></p>
              <p className="text-xs text-slate-500">Riyadh, Kingdom of Saudi Arabia</p>
            </div>
          </section>
        </div>
      ),
      renderAr: () => (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm text-right">
          <div className="p-4 bg-emerald-50/60 border-r-4 border-emerald-500 rounded-xl text-emerald-950 text-xs font-semibold">
            تمت صياغة سياسة الخصوصية هذه خصيصاً لمنصة ساري ريميت وهي متوافقة تماماً مع نظام حماية البيانات الشخصية (PDPL) الصادر بالمرسوم الملكي الكريم رقم (م/١٩) في المملكة العربية السعودية. توضح هذه السياسة كيف نجمع بياناتك الشخصية ونعالجها ونحميها.
          </div>

          <p className="font-semibold text-slate-900 text-base">
            في ساري ريميت، نضع خصوصية وأمان أعضاء مجتمعنا، وخاصة المغتربين في المملكة العربية السعودية، على رأس أولوياتنا. إن حماية معلوماتك الشخصية هي أحد مبادئنا الأساسية المطلقة، ونسعى لتوضيح ممارساتنا بلغة بسيطة ومفهومة للجميع.
          </p>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">١. مقدمة</h3>
            <p>
              ساري ريميت هي منصة مستقلة لدعم القرار مصممة لمساعدة المغتربين على مقارنة قنوات التحويل المختلفة (مثل البنوك، والمحافظ الرقمية، ومؤسسات التحويل)، وتقدير التوفير المالي، واتخاذ قرارات تحويل واعية. نحن لا نعالج معاملات مالية ولا نحتفظ بالأموال. إن حماية بياناتك واحترام خصوصيتك هي ركيزة أساسية لكل ما نبنيه.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٢. المعلومات التي نجمعها</h3>
            <p>
              نحن نجمع فقط المعلومات الأساسية الضرورية لتقديم خدمات المقارنة، والحفاظ على أمان النظام، وتمكين المشاركة المجتمعية، وتشمل:
            </p>
            <ul className="list-disc pr-5 space-y-2">
              <li>
                <strong>بيانات الحساب:</strong> الاسم الكامل، والبريد الإلكتروني، ورقم الهاتف (رقم جوال سعودي)، واللغة المفضلة، وبلد التحويل الافتراضي، وبيانات التحقق الآمن من الهوية.
              </li>
              <li>
                <strong>بيانات التفضيلات:</strong> إعداداتك المخصصة، وممرات التحويل المحفوظة، وتفضيلات تنبيهات الأسعار.
              </li>
              <li>
                <strong>سجلات الحوالات:</strong> سجل التحويلات المدونة، والوفر المالي المالي المقدر، وتواريخ الحوالات التي تسجلها بنفسك لمراقبة مدخراتك.
              </li>
              <li>
                <strong>مشاركات الأسعار المجتمعية:</strong> قيم أسعار الصرف، والرسوم، والعملات، ولقطات الشاشة التي ترفعها طواعية لتأكيد صحة الأسعار.
              </li>
              <li>
                <strong>طلبات الدعم:</strong> تذاكر الدعم والامتثال، والملاحظات، والمراسلات البريدية، وأي مرفقات ترفعها لحل المشكلات.
              </li>
              <li>
                <strong>المعلومات التقنية:</strong> نوع المتصفح، ومعلومات الجهاز، وعنوان الـ IP، ومعرفات الجلسة، وسجلات الأمان، وملفات تعريف الارتباط (Cookies).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٣. لماذا نجمع هذه المعلومات</h3>
            <p>
              يتم معالجة بياناتك الشخصية بدقة لأغراض مشروعة وواضحة فقط:
            </p>
            <ul className="list-disc pr-5 space-y-2">
              <li>لإنشاء حسابك وتأمين تسجيل دخولك للمنصة.</li>
              <li>لتمكينك من مقارنة قنوات التحويل وحساب التوفير المقدر.</li>
              <li>لإنشاء توصيات مخصصة لممرات التحويل الخاصة بك.</li>
              <li>للتحقق من صحة أسعار الصرف المشاركة من المجتمع وتدقيق لقطات الشاشة.</li>
              <li>لحماية المنصة من الاحتيال، وإساءة استخدام النظام، وإدخال أسعار وهمية.</li>
              <li>لإرسال التنبيهات المطلوبة منك (مثل إشعارات الأسعار وتحديثات الإنجازات).</li>
              <li>للرد على استفسارات الدعم والامتثال الخاصة بك.</li>
              <li>للاحتفاظ بسجلات التدقيق الإدارية لضمان الامتثال والشفافية.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٤. المسوغ النظامي للمعالجة</h3>
            <p>
              وفقاً لنظام حماية البيانات الشخصية السعودي (PDPL)، نعتمد على المسوغات النظامية التالية لمعالجة بياناتك:
            </p>
            <ul className="list-disc pr-5 space-y-2">
              <li>
                <strong>موافقتك الصريحة:</strong> عند تسجيل حسابك واختيار مشاركة تفضيلاتك طواعية، أو تفعيل الإشعارات.
              </li>
              <li>
                <strong>تنفيذ الخدمات المطلوبة:</strong> المعالجة الضرورية لتقديم الحسابات المقارنة وتحليلات التوفير والتوصيات التي تطلبها.
              </li>
              <li>
                <strong>العمليات المشروعة ومكافحة الاحتيال:</strong> المعالجة الضرورية لحماية أمن المنصة، والتحقق من صحة المدخلات، ومنع إساءة الاستخدام، بما لا يتعارض مع حقوق خصوصيتك.
              </li>
              <li>
                <strong>الالتزامات النظامية:</strong> الامتثال لأي أنظمة رسمية أو توجيهات من الجهات التنظيمية داخل المملكة العربية السعودية.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٥. كيف نحمي معلوماتك</h3>
            <p>
              لحفظ أمان بياناتك، نطبق **إطار عمل ساري ريميت للأمن والتدقيق (SAF)** والذي يشمل معايير أمنية صارمة:
            </p>
            <ul className="list-disc pr-5 space-y-2">
              <li>
                <strong>التشفير:</strong> يتم تشفير جميع البيانات أثناء انتقالها عبر الإنترنت (تشفير TLS/SSL) وعند تخزينها في قواعد بياناتنا السحابية الآمنة.
              </li>
              <li>
                <strong>المصادقة الآمنة:</strong> حماية متقدمة لإدارة الجلسات ورموز تسجيل الدخول عبر خدمات Supabase الآمنة.
              </li>
              <li>
                <strong>أمان على مستوى الصف (RLS):</strong> قيود برمجية تضمن عدم قدرة أي مستخدم على الاطلاع على حوالاتك أو تفضيلاتك الخاصة أو تعديلها.
              </li>
              <li>
                <strong>سجلات التدقيق والصلاحيات:</strong> قواعد صارمة للمشرفين وسجلات كاملة للتغييرات الإدارية لمنع الوصول غير المصرح به.
              </li>
              <li>
                <strong>فحص مكافحة الاحتيال:</strong> خوارزميات ذكية لفحص المساهمات دون كشف بيانات الهوية الشخصية.
              </li>
              <li>
                <strong>خصوصية لقطات الشاشة:</strong> نقوم بحث ومساعدة المستخدمين على قص أو إخفاء الأسماء الكاملة وأرقام الحسابات البنكية الحساسة من لقطات الشاشة قبل إتمام التدقيق.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٦. من يمكنه الوصول إلى بياناتك</h3>
            <p>
              يقوم ساري ريميت على مبدأ عزل البيانات الصارم، ويتم تقييد الوصول وفقاً لقواعد صارمة:
            </p>
            <ul className="list-disc pr-5 space-y-2">
              <li>
                <strong>المستخدم:</strong> لديك حق الوصول الخاص والحصري إلى ملفك التعريفي وتفضيلاتك وسجل حوالاتك، ولا يمكن لأي مستخدم آخر رؤيتها.
              </li>
              <li>
                <strong>مشرفو وإداريو SRCMC:</strong> يُسمح فقط للمشرفين الإداريين المعتمدين بالاطلاع على مساهمات المجتمع أو تذاكر الدعم للتدقيق والحل، ولا يمكنهم أبداً رؤية كلمة مرورك.
              </li>
              <li>
                <strong>النظام الآلي:</strong> يقوم محرك تسوية الأسعار (RRE) ومحرك التكلفة الحقيقية (TCE) بمعالجة البيانات المجمعة آلياً.
              </li>
              <li>
                <strong>لا إفصاح عام:</strong> بيانات حسابك الشخصي محمية بالكامل، ويتم فقط عرض أسعار الصرف المجمعة والمجهلة للعامة.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٧. خدمات الطرف الثالث</h3>
            <p>
              نحن نتكامل فقط مع موفري البنية التحتية الموثوقين الذين يضمنون الالتزام التام بمعايير أمن البيانات السعودية:
            </p>
            <ul className="list-disc pr-5 space-y-2">
              <li>
                <strong>Supabase:</strong> يوفر خدمات المصادقة الآمنة، واستضافة قاعدة البيانات المشفرة، وتخزين لقطات الشاشة الخاصة بالتحقق المجتمعي.
              </li>
              <li>
                <strong>مقدمو الخدمات المستقبليون:</strong> أي تكامل مستقبلي مع أنظمة البريد الإلكتروني أو الإشعارات اللحظية أو التحليلات سيخضع لاختيار دقيق واتفاقيات سرية وحماية بيانات صارمة.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٨. ملفات تعريف الارتباط (Cookies)</h3>
            <p>
              نستخدم ملفات تعريف الارتباط الأساسية لضمان عمل المنصة بكفاءة:
            </p>
            <ul className="list-disc pr-5 space-y-2">
              <li>
                <strong>الملفات الأساسية:</strong> تستخدم لربط جلستك، وتأمين تسجيل دخولك، وتذكر لغتك المفضلة (العربية أو الإنجليزية).
              </li>
              <li>
                <strong>الملفات الاختيارية المستقبلية:</strong> أي ملفات غير أساسية للتحليلات أو قياس الأداء لن يتم تحميلها إلا بعد موافقتك الصريحة.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٩. الاحتفاظ بالبيانات</h3>
            <p>
              تماشياً مع مبادئ نظام حماية البيانات الشخصية السعودي (PDPL)، نحتفظ ببياناتك فقط للفترة الضرورية:
            </p>
            <ul className="list-disc pr-5 space-y-2">
              <li>
                <strong>الحسابات:</strong> يتم الاحتفاظ بها طالما أن حسابك نشط. وعند طلب حذف الحساب، نقوم فوراً بمسح أو تجهيل بياناتك بالكامل.
              </li>
              <li>
                <strong>سجل الحوالات:</strong> يُحفظ لعرض إحصائيات لوحة التحكم الخاصة بك، ويتم حذفه فوراً بطلبك.
              </li>
              <li>
                <strong>مشاركات المجتمع وصور الإيصالات:</strong> يتم دمج بيانات الأسعار، أما لقطات الشاشة المرفوعة فيتم تدميرها وحذفها نهائياً من وحدات التخزين بمجرد انتهاء عملية التدقيق والموافقة.
              </li>
              <li>
                <strong>تذاكر الدعم:</strong> يتم الاحتفاظ بأرشيفها لمتابعة تاريخ الدعم وضمان جودة الخدمة والامتثال.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">١٠. حقوقك بموجب نظام حماية البيانات الشخصية السعودي (PDPL)</h3>
            <p>
              منحك النظام حقوقاً قوية للتحكم في بياناتك الشخصية، ويمكنك تقديم طلب لممارسة هذه الحقوق وتشمل:
            </p>
            <ul className="list-disc pr-5 space-y-2">
              <li>
                <strong>الحق في العلم والوصول:</strong> معرفة البيانات التي نعالجها عنك والاطلاع عليها.
              </li>
              <li>
                <strong>الحق في التصحيح:</strong> طلب تصحيح أي بيانات غير دقيقة أو قديمة أو ناقصة فوراً.
              </li>
              <li>
                <strong>الحق في الإتلاف (الحذف):</strong> طلب حذف بياناتك الشخصية عندما لا يعود هناك حاجة نظامية للاحتفاظ بها.
              </li>
              <li>
                <strong>الحق في الحصول على البيانات (التصدير):</strong> تنزيل نسخة إلكترونية من سجل حوالاتك وبيانات حسابك.
              </li>
              <li>
                <strong>الحق في سحب الموافقة:</strong> يمكنك سحب موافقتك في أي وقت للميزات التي تعتمد على الموافقة (مثل الإشعارات الاختيارية).
              </li>
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              *لممارسة أي من هذه الحقوق، يرجى مراسلتنا مباشرة عبر البريد الإلكتروني support@sariremit.com وسيقوم فريق أمن البيانات بالرد على طلبك المؤكد فوراً.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">١١. خصوصية الأطفال</h3>
            <p>
              ساري ريميت مخصص للبالغين الذين يقومون بإجراء حوالات مالية دولية من المملكة العربية السعودية. ونحن لا نجمع أو نطلب عمداً أي بيانات شخصية من القاصرين أو الأطفال تحت السن القانوني في المملكة.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">١٢. المستخدمون الدوليون ونقل البيانات</h3>
            <p>
              يتم استضافة وتشغيل ساري ريميت داخل المملكة العربية السعودية لخدمة المقيمين محلياً. وعند الحاجة لعمليات التخزين السحابي الآمن أو النسخ الاحتياطي، قد يتم معالجة بعض البيانات المشفرة بالتعاون مع شركاء تقنيين عالميين تحت حماية تعاقدية صارمة تلتزم بضوابط نظام حماية البيانات الشخصية (PDPL).
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">١٣. تحديثات السياسة</h3>
            <p>
              قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر لمواكبة تطور المنصة أو التغيرات التنظيمية. وفي حال حدوث تغييرات جوهرية، سنقوم بإخطارك عبر البريد الإلكتروني أو من خلال لوحة التحكم أو طلب مراجعتها عند تسجيل الدخول. إن استمرارك في استخدام المنصة بعد التحديث يُعتبر موافقة عليها.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">١٤. اتصل بنا</h3>
            <p>
              إذا كانت لديك أي أسئلة أو رغبة في ممارسة حقوقك أو التواصل مع مكتب الامتثال لسلامة البيانات لدينا، يرجى مراسلة فريقنا:
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mt-2 text-right">
              <p className="font-bold text-slate-900">إطار عمل ساري ريميت القانوني والامتثال (SLCF)</p>
              <p className="text-xs text-slate-500 mt-0.5">الدعم الرئيسي: <span className="font-bold text-emerald-650">support@sariremit.com</span></p>
              <p className="text-xs text-slate-500">الرياض، المملكة العربية السعودية</p>
            </div>
          </section>
        </div>
      )
    },
    'terms-of-use': {
      titleEn: "Terms of Use",
      titleAr: "شروط الاستخدام",
      icon: FileText,
      lastUpdatedEn: "Last updated: July 16, 2026 (v1.2)",
      lastUpdatedAr: "آخر تحديث: ١٦ يوليو ٢٠٢٦ (إصدار ١.٢)",
      renderEn: () => (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
          <div className="p-4 bg-emerald-50/60 border-l-4 border-emerald-500 rounded-xl text-emerald-950 text-xs font-semibold leading-normal">
            These Terms of Use constitute a legally binding agreement between you and SariRemit. They govern your access to and use of our platform, forming an essential component of the SariRemit Legal & Compliance Framework (SLCF) under the regulations of the Kingdom of Saudi Arabia.
          </div>

          <p className="font-semibold text-slate-900 text-base">
            Welcome to SariRemit. By registering an account, submitting rates, or using any part of our platform, you acknowledge that you have read, understood, and agreed to be bound by these Terms of Use.
          </p>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">1. About SariRemit (What We Are & What We Are NOT)</h3>
            <p>
              <strong>SariRemit</strong> is an independent remittance comparison and financial intelligence platform. Our platform is built using the <strong>SariRemit Design System (SDS)</strong> to serve expatriates living in the Kingdom of Saudi Arabia.
            </p>
            <p className="font-semibold text-slate-900">Our Purpose is to help users:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Compare live and community-sourced remittance channels in Saudi Arabia.</li>
              <li>Estimate true transfer costs, including exchange rates, transfer fees, and Value Added Tax (VAT).</li>
              <li>Calculate estimated savings compared to local traditional channels.</li>
              <li>Track savings milestones and achievements using data-driven intelligence.</li>
            </ul>
            <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-xl text-rose-950 text-xs font-semibold leading-normal mt-2">
              <strong>CRITICAL NOTICE – WHAT WE ARE NOT:</strong> SariRemit does NOT transfer money, process transactions, receive or hold customer funds, act as a bank, or represent any commercial remittance provider. Users must complete all remittance transfers directly with their chosen licensed financial institution (e.g., STC Pay, urpay, Al Rajhi, etc.).
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">2. Eligibility</h3>
            <p>
              To create an account and participate in our platform, you must meet the minimum legal age of majority in the Kingdom of Saudi Arabia (18 years or older) and possess full legal capacity. You agree to use only one personal account on the platform unless explicitly authorized by a SariRemit administrator.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">3. User Accounts & Security</h3>
            <p>
              When you register an account, you agree to provide complete and accurate registration information (including your name, email address, and KSA mobile phone number) and keep this information updated. You are solely responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Maintaining the confidentiality of your login credentials and password.</li>
              <li>All activities and data submissions carried out under your account.</li>
              <li>Reporting any suspected unauthorized access or compromise of your credentials immediately to support@sariremit.com.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">4. Platform Services & Disclaimers</h3>
            <p>
              SariRemit offers a suite of advanced intelligence tools designed to assist you:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Rate Resolution Engine (RRE):</strong> Dynamically resolves volatile exchange rate inputs to yield clean baseline estimates.</li>
              <li><strong>SariRemit Intelligence Core (SIC):</strong> Auto-calculates multi-factor performance indexes to generate optimal recommendations.</li>
              <li><strong>True Cost Engine (TCE):</strong> Factors in hidden margins, fixed transfer fees, and standard Saudi VAT.</li>
              <li><strong>SariRemit Intelligence Score (SIS):</strong> Rates corridors based on reliability, rate attractiveness, and data freshness.</li>
              <li><strong>SariRemit Engagement & Progress System (SEPS):</strong> Rewards community contributions with milestones and achievement badges.</li>
              <li><strong>SariRemit Notification System (SNS):</strong> Dispatches critical rate alerts, fraud notifications, and security updates.</li>
            </ul>
            <p className="font-semibold text-slate-900">
              *FINANCIAL DISCLAIMER: All recommendations, comparative rankings, and intelligence indicators are informational tools designed to assist decision-making. They should not be interpreted as formal financial or investment advice.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">5. Community Rate Submissions & Verification</h3>
            <p>
              Under our <strong>Community Rate Verification System (CRVS)</strong>, you can submit current exchange rates and fees. To ensure community integrity, you agree that:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Every submission must be authentic, honest, and based on actual exchange rate checks.</li>
              <li>Where required, you must upload a clear screenshot of your provider screen or transfer receipt as verification evidence.</li>
              <li>All community submissions must represent genuine, non-manipulated transactions.</li>
              <li>Our designated administrators at the <strong>SariRemit Community Monitoring & Control (SRCMC)</strong> center review, verify, approve, or reject submissions before publishing.</li>
            </ul>
            <p className="text-xs text-rose-500 font-bold">
              PROHIBITED ACTIONS: Uploading fake screenshots, edited receipts, fraudulent rates, misleading parameters, or spamming multiple identical submissions is strictly forbidden and monitored.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">6. Acceptable Use Policy</h3>
            <p>
              You agree to use SariRemit strictly for lawful, personal purposes. You are forbidden from:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Impersonating any other individual, financial provider, or SariRemit administrator.</li>
              <li>Employing automated software, scrapers, crawlers, or bots to harvest data from our platform.</li>
              <li>Introducing malware, viruses, or attempting unauthorized access to any backend server.</li>
              <li>Manipulating rate submissions or recommendations through coordinated behavior or fraudulent activity.</li>
              <li>Using our Brand assets or user details for unsolicited advertising, commercial recruitment, or marketing.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">7. Anti-Fraud Framework (SAF)</h3>
            <p>
              We implement the **SariRemit Anti-Fraud Framework (SAF)** to preserve platform reliability and safeguard our community. Under the SAF:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Our backend systems perform continuous screening on all rate submissions and uploaded verification images.</li>
              <li>SariRemit reserves the absolute right to temporarily restrict accounts, reject suspicious content, and permanently block users engaging in systematic fraud or receipt alteration.</li>
              <li>We cooperate with administrative standards to prevent rate seeding abuse. However, the presence of SAF does not guarantee that all fraudulent activity will be detected immediately.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">8. Recommendations & Intelligence Core (SIC)</h3>
            <p>
              Recommendations, badges, and corridor comparisons are calculated in real-time by the <strong>SariRemit Intelligence Core (SIC)</strong>. These calculations weigh multiple parameters: exchange rates, transfer fees, Saudi VAT, transaction confidence levels, historical consistency, and data freshness. Calculations and rankings are updated automatically and can change instantly as market parameters fluctuate.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">9. Third-Party Providers</h3>
            <p>
              SariRemit lists, compares, and references independent digital wallets and banks operating in Saudi Arabia. All third-party logos, trademarks, names, and visual designs remain the exclusive property of their respective owners. Where official permissions have been obtained, logos are managed under our <strong>Brand Asset Manager (BAM)</strong>; otherwise, generic placeholder assets are styled to represent independent channels.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">10. Intellectual Property Rights</h3>
            <p>
              SariRemit owns all rights, titles, and interests in the platform’s underlying technology, source code, visual components, documentation, algorithms, and branding. The following proprietary subsystems are protected by copyright and intellectual property laws:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] font-bold uppercase text-slate-600">
              <li>• SariRemit Intelligence Core (SIC)</li>
              <li>• Rate Resolution Engine (RRE)</li>
              <li>• True Cost Engine (TCE)</li>
              <li>• SariRemit Intelligence Score (SIS)</li>
              <li>• SariRemit Anti-Fraud Framework (SAF)</li>
              <li>• SariRemit Engagement & Progress System (SEPS)</li>
              <li>• SariRemit Notification System (SNS)</li>
              <li>• Brand Asset Manager (BAM)</li>
              <li>• SariRemit Design System (SDS)</li>
              <li>• SariRemit Legal & Compliance Framework (SLCF)</li>
            </ul>
            <p className="text-xs">
              You are strictly forbidden from copying, reverse engineering, distributing, selling, licensing, or commercially exploiting any component of our platform or proprietary systems without prior written consent from our legal team.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">11. Savings Estimates & Mathematical Models</h3>
            <p>
              All savings calculations displayed across SariRemit are estimates derived from comparison algorithms using active database rates. <strong>Actual savings completed in real life may vary</strong> due to dynamic exchange rate movements, individual wallet promotion codes, specific bank transfer fees, regional tax structures, and transaction execution times. Always verify exact rates in your target provider app before transfer.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">12. Limitation of Liability</h3>
            <p>
              SariRemit and its operators work diligently to maintain accurate comparison indexes. However, because exchange markets fluctuate constantly:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>We do not guarantee the availability, accuracy, or performance of any third-party remittance provider.</li>
              <li>We are not responsible or liable for any transaction failures, transfer delays, financial losses, or adverse exchange rate changes.</li>
              <li>To the maximum extent permitted under KSA regulations, SariRemit shall not be liable for any indirect, incidental, or consequential damages arising from decisions made based on platform recommendations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">13. Account Suspension & Termination</h3>
            <p>
              SariRemit reserves the right to suspend or permanently terminate your account, access tokens, or capability to submit community rates at our discretion, without warning, in the event of:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>A direct violation of these Terms of Use or the SLCF.</li>
              <li>Attempting to upload falsified, forged, or malicious rate verification receipts.</li>
              <li>Coordinated attempts to manipulation recommendations or disrupt servers.</li>
              <li>Regulatory or compliance directives issued by government authorities in the Kingdom of Saudi Arabia.</li>
            </ul>
            <p className="text-xs font-bold text-slate-500">
              *A reasonable administrative review process is conducted in the SRCMC control panel before any permanent ban is applied to an active user.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">14. Privacy & Consent Integration</h3>
            <p>
              Your personal data is managed strictly in accordance with our <strong>SariRemit Privacy Policy</strong>, designed to fully comply with the Saudi Personal Data Protection Law (PDPL). By accepting these Terms, you also acknowledge how we collect, process, secure, and delete your personal information as defined in that policy.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">15. Changes and Versioning</h3>
            <p>
              We may update these Terms of Use from time to time. When a new version is published through the <strong>SLCF Terms Manager</strong> inside the SRCMC panel, the version indicator will increase. Material changes will be communicated via the dashboard or through mandatory consent updates. Your continued use of the platform represents your acceptance of the updated Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">16. Governing Law & Dispute Resolution</h3>
            <p>
              These Terms of Use are governed by and construed in accordance with the laws and regulations of the Kingdom of Saudi Arabia. Any disputes or issues arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent judicial authorities in Riyadh, Kingdom of Saudi Arabia.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">17. Contact & Support Desk</h3>
            <p>
              If you have any questions, feedback, compliance requests, or wish to report a security/terms violation, please contact our administrative desk:
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mt-2">
              <p className="font-extrabold text-slate-900">SariRemit Legal & Compliance Framework (SLCF)</p>
              <p className="text-xs text-slate-500 mt-1">Compliance Email: <span className="font-bold text-emerald-650">support@sariremit.com</span></p>
              <p className="text-xs text-slate-500">Riyadh, Kingdom of Saudi Arabia</p>
            </div>
          </section>
        </div>
      ),
      renderAr: () => (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm text-right">
          <div className="p-4 bg-emerald-50/60 border-r-4 border-emerald-500 rounded-xl text-emerald-950 text-xs font-semibold leading-normal">
            تمثل شروط الاستخدام هذه اتفاقية ملزمة قانوناً بينك وبين منصة ساري ريميت. وهي تحكم وصولك واستخدامك للمنصة، وتعد جزءاً أساسياً من إطار عمل ساري ريميت القانوني والامتثال (SLCF) بموجب أنظمة وقوانين المملكة العربية السعودية.
          </div>

          <p className="font-semibold text-slate-900 text-base">
            مرحباً بكم في ساري ريميت. بتسجيلك لحساب، أو إضافة أسعار صرف، أو استخدام أي جزء من منصتنا، فإنك تقر بأنك قد قرأت وفهمت ووافقت على الالتزام بشروط الاستخدام هذه.
          </p>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">١. حول ساري ريميت (ما تمثله المنصة وما لا تمثله)</h3>
            <p>
              <strong>ساري ريميت</strong> هي منصة مقارنة مستقلة وتحليلية لأسعار تحويل الأموال. تم بناء المنصة باستخدام <strong>نظام ساري ريميت للتصميم (SDS)</strong> لخدمة المغتربين المقيمين في المملكة العربية السعودية.
            </p>
            <p className="font-semibold text-slate-900">هدفنا الرئيسي هو مساعدة المستخدمين على:</p>
            <ul className="list-disc pr-5 space-y-1.5">
              <li>مقارنة أسعار وممرات التحويل المختلفة المتاحة في المملكة العربية السعودية لحظة بلحظة.</li>
              <li>تقدير التكلفة الحقيقية لعمليات التحويل بما يشمل أسعار الصرف، الرسوم الثابتة، وضريبة القيمة المضافة (VAT).</li>
              <li>حساب الوفر المالي المقدر مقارنة بقنوات التحويل التقليدية.</li>
              <li>مراقبة إنجازات ومستويات مدخراتك من خلال تحليلات تفصيلية للبيانات.</li>
            </ul>
            <div className="p-4 bg-rose-50 border-r-4 border-rose-500 rounded-xl text-rose-950 text-xs font-semibold leading-normal mt-2">
              <strong>تنبيه هام للغاية – ما لا تمثله المنصة:</strong> ساري ريميت لا تقوم بتحويل الأموال، ولا تعالج أي معاملات مالية، ولا تستقبل أو تحتفظ بأموال العملاء، ولا تمثل أي بنك أو محفظة رقمية بشكل تجاري. يجب على المستخدمين إتمام عمليات التحويل مباشرة عبر التطبيقات المرخصة لمزودي الخدمة (مثل STC Pay، urpay، الراجحي، إلخ).
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">٢. الأهلية وشروط التسجيل</h3>
            <p>
              لإنشاء حساب والمشاركة في المنصة، يجب أن تبلغ السن القانوني للرشد في المملكة العربية السعودية (١٨ عاماً أو أكثر) وتتمتع بالأهلية القانونية الكاملة. وتوافق على استخدام حساب شخصي واحد فقط على المنصة ما لم يتم منحك تصريحاً صريحاً ومكتوباً من إدارة المنصة.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">٣. حسابات المستخدمين وأمن البيانات</h3>
            <p>
              عند إنشاء حسابك، فإنك توافق على تقديم معلومات صحيحة ودقيقة (تشمل الاسم الكامل، البريد الإلكتروني، ورقم الجوال السعودي الخاص بك) والحرص على تحديثها باستمرار. وتتحمل المسؤولية الكاملة عن:
            </p>
            <ul className="list-disc pr-5 space-y-1">
              <li>الحفاظ على سرية بيانات تسجيل دخولك وكلمة المرور الخاصة بك.</li>
              <li>جميع الأنشطة ومشاركات البيانات التي تتم من خلال حسابك.</li>
              <li>الإبلاغ الفوري عن أي محاولة وصول غير مصرح بها أو اشتباه في اختراق حسابك عبر البريد support@sariremit.com.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">٤. خدمات المنصة وإخلاء المسؤولية</h3>
            <p>
              يوفر ساري ريميت حزمة من الأدوات والمحركات الذكية لمساعدتك:
            </p>
            <ul className="list-disc pr-5 space-y-2">
              <li><strong>محرك تسوية الأسعار (RRE):</strong> يعمل ديناميكياً على تصفية وتنقية بيانات أسعار الصرف لتوفير تقديرات موثوقة ومتقاربة.</li>
              <li><strong>نواة ذكاء ساري ريميت (SIC):</strong> تقوم بحساب خوارزميات الأداء المتعددة لتوليد التوصيات الأكثر ملائمة.</li>
              <li><strong>محرك التكلفة الحقيقية (TCE):</strong> يقوم بحساب الفروق المخفية، الرسوم الثابتة، والضريبة المضافة المطبقة في السعودية.</li>
              <li><strong>مؤشر ذكاء ساري ريميت (SIS):</strong> يقيم ممرات التحويل بناءً على الموثوقية، جاذبية السعر، وحداثة البيانات المعروضة.</li>
              <li><strong>نظام الإنجازات والتقدم (SEPS):</strong> يكافئ مساهمات المجتمع الإيجابية بشارات ومستويات تقديرية.</li>
              <li><strong>نظام الإشعارات والتنبيهات (SNS):</strong> يرسل تنبيهات الأسعار المهمة، إشعارات الأمان، والتحذيرات من الاحتيال.</li>
            </ul>
            <p className="font-semibold text-slate-900">
              *إخلاء مسؤولية مالية: جميع التوصيات، والترتيبات المقارنة، ومؤشرات الأداء هي أدوات استرشادية لمساعدتك في اتخاذ القرار، ولا يجب اعتبارها بأي حال من الأحوال نصيحة مالية أو مصرفية رسمية.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">٥. مشاركات المجتمع ونظام التحقق من الأسعار</h3>
            <p>
              بموجب <strong>نظام التحقق المجتمعي من الأسعار (CRVS)</strong>، يمكنك إضافة ومشاركة أسعار الصرف والرسوم. لضمان مصداقية المجتمع، فإنك توافق على ما يلي:
            </p>
            <ul className="list-disc pr-5 space-y-2">
              <li>يجب أن تكون كل مشاركة صحيحة وصادقة تماماً ومبنية على أسعار تحويل فعلية.</li>
              <li>يجب عليك عند الحاجة رفع لقطة شاشة واضحة وغير معدلة لشاشة تطبيق المحفظة أو إيصال التحويل كدليل على صحة السعر.</li>
              <li>يجب أن تمثل مشاركات المجتمع معاملات حقيقية وخالية من أي تلاعب رقمي.</li>
              <li>تقوم إدارة <strong>مركز مراقبة وتحكم مجتمع ساري ريميت (SRCMC)</strong> بمراجعة وتدقيق واعتماد أو رفض المساهمات قبل نشرها للعامة.</li>
            </ul>
            <p className="text-xs text-rose-500 font-bold">
              الإجراءات المحظورة: يُمنع منعاً باتاً رفع لقطات شاشة مزيفة، أو إيصالات معدلة بالفوتوشوب، أو إدخال أسعار وهمية ومضللة، أو تكرار الإرسال بطريقة مزعجة (Spam).
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">٦. سياسة الاستخدام المقبول</h3>
            <p>
              أنت توافق على استخدام ساري ريميت لأغراض قانونية وشخصية فقط. ويُحظر عليك تماماً:
            </p>
            <ul className="list-disc pr-5 space-y-1.5">
              <li>انتحال شخصية أي فرد آخر، أو مزود خدمة مالي، أو مشرف لدى ساري ريميت.</li>
              <li>استخدام البرمجيات الآلية، أو أدوات سحب البيانات (Scrapers)، أو العناكب لجمع محتوى المنصة آلياً.</li>
              <li>إدخال الفيروسات، أو برمجيات التجسس، أو محاولة الوصول غير المصرح به لقواعد البيانات أو الخوادم الخلفية.</li>
              <li>التلاعب بنظام التوصيات أو أسعار الصرف من خلال سلوك جماعي منسق أو عمليات تسجيل وهمية.</li>
              <li>استخدام أصول المنصة أو بيانات الأعضاء في الإعلانات التجارية غير المرغوب فيها، أو التسويق.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">٧. إطار عمل مكافحة الاحتيال (SAF)</h3>
            <p>
              نحن نطبق **إطار عمل ساري ريميت لمكافحة الاحتيال (SAF)** لضمان أمان وموثوقية مجتمعنا. وبموجب هذا الإطار:
            </p>
            <ul className="list-disc pr-5 space-y-1.5">
              <li>تقوم خوارزمياتنا بفحص مستمر لجميع مدخلات الأسعار وصور التحقق المرفوعة من المجتمع.</li>
              <li>يحتفظ ساري ريميت بالحق الكامل في تقييد الحسابات مؤقتاً، ورفض المساهمات المشبوهة، وحظر الحسابات التي تحاول ممارسة الاحتيال بشكل دائم.</li>
              <li>نحن نتعاون بشكل كامل مع المعايير الإدارية والرقابية؛ ومع ذلك، فإن وجود هذا الإطار لا يضمن الكشف الفوري عن كل المحاولات الاحتيالية في نفس اللحظة.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">٨. التوصيات ونواة الذكاء (SIC)</h3>
            <p>
              يتم توليد جميع التوصيات، الشارات، ومقارنات ممرات التحويل في الوقت الفعلي بواسطة <strong>نواة ذكاء ساري ريميت (SIC)</strong>. وتأخذ هذه الخوارزميات في الاعتبار معايير متعددة تشمل: أسعار الصرف المباشرة، الرسوم، ضريبة القيمة المضافة، موثوقية السعر، تكرار التحديث، وحداثة البيانات. هذه الحسابات تتغير ديناميكياً وتلقائياً مع تقلبات سوق الصرف.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">٩. مقدمو الخدمات من الجهات الخارجية</h3>
            <p>
              يقوم ساري ريميت بمقارنة وعرض معلومات البنوك والمحافظ الرقمية المرخصة في المملكة. وتبقى جميع الشعارات، العلامات التجارية، الأسماء، والتصاميم ملكاً حصرياً لأصحابها ومؤسساتها الرسمية. وعند توفر التصريحات الرسمية، يتم إدارة الشعارات عبر <strong>مدير أصول العلامات التجارية (BAM)</strong>؛ وفي حال عدم توفرها، يتم استخدام أصول افتراضية مناسبة لتمثيل تلك القنوات بشكل حيادي ومستقل.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">١٠. حقوق الملكية الفكرية</h3>
            <p>
              يمتلك ساري ريميت جميع الحقوق والعناوين والمصالح في التقنيات الأساسية للمنصة، الكود المصدري، التصاميم البصرية، الخوارزميات، والهوية التجارية. الأنظمة والبرمجيات التالية تعد ملكية فكرية محمية بالكامل:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] font-bold uppercase text-slate-600">
              <li>• نواة ذكاء ساري ريميت (SIC)</li>
              <li>• محرك تسوية الأسعار (RRE)</li>
              <li>• محرك حساب التكلفة الحقيقية (TCE)</li>
              <li>• مؤشر ذكاء ساري ريميت (SIS)</li>
              <li>• إطار عمل مكافحة الاحتيال (SAF)</li>
              <li>• نظام الإنجازات والتقدم (SEPS)</li>
              <li>• نظام الإشعارات والتنبيهات (SNS)</li>
              <li>• مدير أصول العلامات التجارية (BAM)</li>
              <li>• نظام ساري ريميت للتصميم (SDS)</li>
              <li>• إطار عمل ساري ريميت القانوني والامتثال (SLCF)</li>
            </ul>
            <p className="text-xs">
              يُمنع منعاً باتاً نسخ، أو إعادة هندسة كود المنصة (Reverse Engineering)، أو بيع، أو ترخيص، أو استغلال أي جزء من أنظمتنا وبرمجياتنا التجارية دون الحصول على موافقة خطية مسبقة من الإدارة القانونية لدينا.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">١١. تقديرات التوفير والنمذجة الرياضية</h3>
            <p>
              جميع حسابات التوفير المعروضة عبر لوحة تحكم ساري ريميت هي تقديرات تم حسابها بواسطة خوارزمياتنا الرياضية بناءً على الأسعار المخزنة في قاعدة البيانات. <strong>قد يختلف التوفير الفعلي المحقق على أرض الواقع</strong> نظراً للتغيرات السريعة في أسعار الصرف، العروض الترويجية والخصومات لمزودي الخدمة، توقيت التنفيذ، وتكلفة التحويل البنكي المصدرية. يُرجى دائماً التأكد من السعر النهائي قبل إتمام الحوالة.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">١٢. حدود المسؤولية</h3>
            <p>
              يبذل فريق ساري ريميت قصارى جهده لضمان دقة معلومات المقارنة ومعاييرها. ولكن نظراً لتقلب الأسواق المستمر:
            </p>
            <ul className="list-disc pr-5 space-y-1.5">
              <li>نحن لا نضمن دقة أو جاهزية أو أداء أي بنك أو محفظة رقمية تابعة لجهة خارجية.</li>
              <li>نحن غير مسؤولين عن أي خطأ في تنفيذ المعاملات، تأخر الحوالات، خسارة مالية، أو تغير مفاجئ في الأسعار من قبل مزودي الخدمة.</li>
              <li>بالحد الأقصى المسموح به بموجب الأنظمة المرعية في المملكة العربية السعودية، لا يتحمل ساري ريميت أي مسؤولية عن أي أضرار غير مباشرة أو تبعية ناتجة عن استخدام المنصة وتوصياتها.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">١٣. تعليق وإنهاء الحسابات</h3>
            <p>
              يحتفظ ساري ريميت بالحق الكامل في تعليق أو إنهاء حسابك ومصادقة تسجيل دخولك ومنعك من رفع أي مساهمات على المنصة في الحالات التالية:
            </p>
            <ul className="list-disc pr-5 space-y-1.5">
              <li>مخالفة شروط الاستخدام هذه أو معايير إطار العمل القانوني (SLCF).</li>
              <li>محاولة رفع صور فواتير مزيفة أو لقطات شاشة تم التلاعب بها رقمياً.</li>
              <li>محاولات منسقة لتزييف وتوجيه نظام التوصيات أو التسبب في تعطيل الخوادم.</li>
              <li>تلقي توجيهات أو رغبات رسمية من الجهات التنظيمية والرقابية في المملكة العربية السعودية.</li>
            </ul>
            <p className="text-xs font-bold text-slate-500">
              *تخضع جميع قرارات الإنهاء لمراجعة إدارية وبشرية دقيقة في مركز تحكم SRCMC قبل تطبيق الحظر النهائي على العضو الملتزم.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">١٤. الخصوصية والاندماج مع نظام حماية البيانات</h3>
            <p>
              يتم إدارة وحماية بياناتك الشخصية بالكامل طبقاً لـ <strong>سياسة الخصوصية لساري ريميت</strong>، والمتوافقة تماماً مع نظام حماية البيانات الشخصية السعودي (PDPL). بموافقتك على شروط الاستخدام هذه، فإنك تؤكد اطلاعك وموافقتك أيضاً على ممارسات جمع، معالجة، وحفظ وإتلاف البيانات المبينة في تلك السياسة.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">١٥. التحديثات والإصدارات</h3>
            <p>
              قد نقوم بتحديث شروط الاستخدام هذه من وقت لآخر. وعند نشر إصدار جديد عبر <strong>مدير الشروط في إطار العمل القانوني (SLCF)</strong> داخل لوحة تحكم SRCMC، سيتغير رقم الإصدار المعروض. وسيتم إبلاغ الأعضاء بالتغييرات الجوهرية من خلال لوحة التحكم أو الإشعارات. استمرار استخدامك للمنصة يمثل موافقتك على الإصدار الجديد.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">١٦. القانون الحاكم وحل النزاعات</h3>
            <p>
              تخضع شروط الاستخدام هذه وتُفسر وفقاً للأنظمة واللوائح والتعليمات المعمول بها في المملكة العربية السعودية. وتخضع جميع النزاعات أو الخلافات الناشئة عنها أو المتصلة بها للاختصاص القضائي الحصري والمطلق للمحاكم والجهات القضائية المختصة في مدينة الرياض، المملكة العربية السعودية.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">١٧. الاتصال ومكتب الامتثال</h3>
            <p>
              إذا كان لديك أي سؤال، أو ملاحظة، أو رغبة في التواصل مع مكتب الامتثال والالتزام القانوني لدينا، يرجى الكتابة إلينا:
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mt-2 text-right">
              <p className="font-extrabold text-slate-900">إطار عمل ساري ريميت القانوني والامتثال (SLCF)</p>
              <p className="text-xs text-slate-500 mt-1">البريد الإلكتروني للامتثال: <span className="font-bold text-emerald-650">support@sariremit.com</span></p>
              <p className="text-xs text-slate-500">الرياض، المملكة العربية السعودية</p>
            </div>
          </section>
        </div>
      )
    },
    'disclaimer': {
      titleEn: "Disclaimer",
      titleAr: "إخلاء المسؤولية",
      icon: AlertTriangle,
      lastUpdatedEn: "Last updated: July 10, 2026",
      lastUpdatedAr: "آخر تحديث: ١٠ يوليو ٢٠٢٦",
      renderEn: () => (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-xl text-amber-900 text-xs font-semibold">
            SariRemit is an independent remittance intelligence platform. It does not process, receive, hold, or transmit funds. All financial transactions must be completed directly with authorized third-party money transfer operators.
          </div>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">Information Accuracy Disclaimer</h3>
            <p>
              The rate and cost estimates provided on SariRemit are generated dynamically from community-reported transactions and publicly verified sources. While our backend algorithms audit submissions for reliability, <strong>no displayed rate, fee, or savings estimate is legally binding or guaranteed.</strong> Financial providers alter rates and fee matrices without warning.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">No Professional Financial Advice</h3>
            <p>
              The analyses, indicators, confidence ratings, and relative rankings provided on SariRemit represent data-driven comparison summaries. They do not constitute financial advice, banking recommendations, or fiduciary guidance. Users bear full responsibility for evaluating their chosen third-party platforms before authorizing capital transfers.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">Independent Recommendations</h3>
            <p>
              No remittance provider, bank, or digital wallet operator can purchase a higher recommendation score. Our recommendations are strictly determined by the net recipient amount and confidence ratings resolved through crowd-sourced evidence.
            </p>
          </section>
        </div>
      ),
      renderAr: () => (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm text-right">
          <div className="p-4 bg-amber-50 border-r-4 border-amber-500 rounded-xl text-amber-900 text-xs font-semibold">
            ساري ريميت هي منصة مستقلة لمعلومات أسعار الصرف وتحليلات التحويل. المنصة لا تقوم بمعالجة أو استلام أو الاحتفاظ بالأموال أو تحويلها. يجب إتمام جميع المعاملات المالية مباشرة مع مشغلي تحويل الأموال المرخصين قانونياً.
          </div>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">إخلاء المسؤولية عن دقة المعلومات</h3>
            <p>
              يتم إنشاء تقديرات الأسعار والرسوم المعروضة في ساري ريميت ديناميكياً من المعاملات المبلغ عنها من المجتمع والمصادر العامة المعتمدة. ورغم أن خوارزمياتنا تدقق المساهمات لضمان موثوقيتها، إلا أنه <strong>لا توجد أسعار صرف أو رسوم أو تقديرات توفير ملزمة قانونياً أو مضمونة تماماً.</strong> قد يقوم مقدمو الخدمات بتغيير الأسعار والرسوم دون إشعار مسبق.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">ليست استشارة مالية مهنية</h3>
            <p>
              إن التحليلات ومؤشرات درجة الثقة والترتيب النسبي الموضحة في ساري ريميت هي مجرد ملخصات مقارنة قائمة على البيانات، وليست بمثابة نصائح مالية أو توصيات بنكية. يتحمل المستخدمون المسؤولية الكاملة عن تقييم قنوات التحويل المختارة قبل تحويل أموالهم.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">توصيات مستقلة بالكامل</h3>
            <p>
              لا يمكن لأي شركة تحويل أموال أو بنك أو محفظة رقمية شراء ترتيب أعلى في توصياتنا. توصياتنا تحدد بدقة وبشكل مستقل تماماً بناءً على أعلى مبلغ مستلم وعوامل الثقة المثبتة بالأدلة.
            </p>
          </section>
        </div>
      )
    },
    'community-verification-policy': {
      titleEn: "Community Verification Policy",
      titleAr: "سياسة التحقق المجتمعي",
      icon: CheckSquare,
      lastUpdatedEn: "Last updated: July 10, 2026",
      lastUpdatedAr: "آخر تحديث: ١٠ يوليو ٢٠٢٦",
      renderEn: () => (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
          <p className="font-semibold text-slate-900 text-base">
            SariRemit operates on a foundation of absolute trust and verified crowd-sourced data. This policy outlines how community contributions are audited, and the rules required of contributors.
          </p>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">1. Evidence-Backed Rates</h3>
            <p>
              Unlike standard forums where users can write arbitrary figures, SariRemit requires contributors to back up their reported rates by uploading a clear, unaltered screenshot of their remittance receipt or wallet quote screen.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">2. Review and Moderation Process</h3>
            <p>
              All user-submitted rates enter a pending audit queue. A designated administrator or community verifier manually inspects each submission to verify:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The screenshot explicitly shows the name of the provider (e.g. STC Pay, UrPay).</li>
              <li>The date and timestamp are within the last 24 hours.</li>
              <li>The exchange rate, transfer fee, and destination country match the form inputs.</li>
              <li>There is no trace of digital manipulation or forgery.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">3. Zero Tolerance for Fake Submissions</h3>
            <p>
              Any attempt to seed deliberately false rates or forge transaction screenshots will result in:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The immediate rejection and deletion of the rate submission.</li>
              <li>A permanent ban on the contributing email and IP address.</li>
              <li>Flagging of any associated records inside our audit database.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">4. Privacy of Uploaded Receipts</h3>
            <p>
              Uploaded screenshots are stored securely. We programmatically scan and advise users to crop out any sensitive, non-public personal parameters (such as recipient full names, personal phone numbers, or account IDs) before submitting receipts.
            </p>
          </section>
        </div>
      ),
      renderAr: () => (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm text-right">
          <p className="font-semibold text-slate-900 text-base">
            تأسست ساري ريميت على ركيزة متينة من الثقة المطلقة والبيانات المؤكدة بالأدلة. توضح هذه السياسة كيفية تدقيق مساهمات المجتمع والقواعد الصارمة المفروضة على المساهمين.
          </p>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">١. أسعار مدعومة بالأدلة</h3>
            <p>
              على عكس المنتديات التقليدية حيث يمكن لأي شخص كتابة أرقام عشوائية، يطلب ساري ريميت من المساهمين تأكيد أسعار الصرف المبلغ عنها عن طريق تحميل لقطة شاشة واضحة وغير معدلة لإيصال التحويل أو شاشة التسعيرة في المحفظة الرقمية.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٢. عملية المراجعة والتدقيق</h3>
            <p>
              تدخل جميع الأسعار المضافة من المجتمع في قائمة التدقيق والانتظار. يقوم مشرف أو مدقق مفوض بمراجعة كل طلب يدوياً للتحقق من:
            </p>
            <ul className="list-disc pr-5 space-y-1">
              <li>أن لقطة الشاشة توضح بوضوح اسم الشركة أو البنك (مثل STC Pay، UrPay).</li>
              <li>أن التاريخ والوقت ضمن الـ ٢٤ ساعة الماضية.</li>
              <li>تطابق سعر الصرف، والرسوم، وبلد التحويل مع المدخلات.</li>
              <li>عدم وجود أي تلاعب رقمي أو تزوير في الصورة.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٣. عدم التسامح مع المساهمات الزائفة</h3>
            <p>
              أي محاولة لإضافة أسعار كاذبة عمداً أو تزوير لقطات الشاشة ستؤدي فوراً إلى:
            </p>
            <ul className="list-disc pr-5 space-y-1">
              <li>الرفض الفوري وحذف المشاركة من المنصة.</li>
              <li>حظر الحساب والبريد الإلكتروني والمساهم بشكل نهائي.</li>
              <li>تسجيل المخالفة في سجلات تدقيق النظام لحماية أمان المجتمع.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٤. خصوصية الإيصالات المرفوعة</h3>
            <p>
              يتم تخزين لقطات الشاشة بشكل آمن. نوصي جميع المستخدمين بقص أو إخفاء أي بيانات شخصية حساسة (مثل الاسم الكامل للمستلم، أو أرقام الهواتف الشخصية، أو أرقام الحسابات) من لقطة الشاشة قبل رفعها.
            </p>
          </section>
        </div>
      )
    },
    'rate-update-policy': {
      titleEn: "Rate Update Policy",
      titleAr: "سياسة تحديث الأسعار",
      icon: RefreshCw,
      lastUpdatedEn: "Last updated: July 10, 2026",
      lastUpdatedAr: "آخر تحديث: ١٠ يوليو ٢٠٢٦",
      renderEn: () => (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
          <p className="font-semibold text-slate-900 text-base">
            Remittance markets are highly fluid. This policy details how often rates are updated, how our engines process fresh information, and what our reliability standards mean.
          </p>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">1. Update Frequency</h3>
            <p>
              We monitor financial provider exchange rates constantly. Formally, our Rate Resolution Engine (RRE) aggregates and computes resolved rates dynamically based on:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Continuous Scraping & Community Submissions:</strong> Processed continuously throughout the day.</li>
              <li><strong>Admin Overrides:</strong> Real-time adjustments pushed by platform administrators to reflect official wallet API modifications.</li>
              <li><strong>Market References:</strong> Interbank or mid-market references integrated on an hourly schedule.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">2. Understanding Freshness Statuses</h3>
            <p>
              Every active rate shown is given a transparency freshness tag:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-emerald-650">Fresh (0-8 hours):</strong> Highly current rate, verified today. Confidence rating is maximized.</li>
              <li><strong className="text-amber-600">Aging (8-16 hours):</strong> Stable but older rate. Might have minor variations compared to the live provider rates.</li>
              <li><strong className="text-rose-500">Stale (16+ hours):</strong> Older cached rate. Displayed only as a baseline until a community member or system update refreshes the corridor.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">3. Resolution Hierarchy</h3>
            <p>
              To ensure data integrity, the engine resolves rates according to a strict priority cascade:
              <br />
              <strong>Admin Verified Overrides &gt; Community Confirmed (Recent 8h) &gt; Daily Base Rates.</strong>
              <br />
              If no reliable data is collected for a corridor within 24 hours, SariRemit marks the status as uncertain rather than showing unverified confidence.
            </p>
          </section>
        </div>
      ),
      renderAr: () => (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm text-right">
          <p className="font-semibold text-slate-900 text-base">
            أسواق التحويلات وصرف العملات متغيرة للغاية. توضح هذه السياسة تفاصيل وتكرار تحديث الأسعار وكيفية معالجة محركاتنا للمعلومات الجديدة.
          </p>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">١. وتيرة تحديث الأسعار</h3>
            <p>
              نقوم بمراقبة أسعار صرف مقدمي الخدمة بشكل مستمر. يقوم محركنا (RRE) بدمج وحساب الأسعار ديناميكياً استناداً إلى:
            </p>
            <ul className="list-disc pr-5 space-y-1">
              <li><strong>مشاركات المجتمع المستمرة:</strong> تتم معالجتها وتأكيدها طوال اليوم.</li>
              <li><strong>التحديثات الإدارية:</strong> تعديلات فورية ينشرها مشرفو المنصة لمطابقة التغييرات الرسمية في المحافظ.</li>
              <li><strong>الأسعار المرجعية للسوق:</strong> يتم تحديث أسعار الصرف المرجعية بين البنوك بشكل ساعي.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٢. فهم مستويات حداثة البيانات</h3>
            <p>
              يتم منح كل سعر معروض علامة حداثة وشفافية واضحة:
            </p>
            <ul className="list-disc pr-5 space-y-1">
              <li><strong className="text-emerald-650">جديد (٠-٨ ساعات):</strong> معتمد وحديث جداً، تم تأكيده اليوم. تكون درجة الثقة فيه قصوى.</li>
              <li><strong className="text-amber-600">متوسط (٨-١٦ ساعة):</strong> سعر مستقر ولكنه قديم نسبياً. قد يحتوي على اختلافات طفيفة عن السعر الحالي.</li>
              <li><strong className="text-rose-500">قديم (أكثر من ١٦ ساعة):</strong> يتم عرضه فقط كمرجع أساسي حتى يقوم عضو في المجتمع أو المشرف بتحديثه.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٣. تسلسل تسوية الأسعار</h3>
            <p>
              لضمان سلامة البيانات، يتبع المحرك خوارزمية تسوية صارمة:
              <br />
              <strong>تحديث المشرفين المعتمدين &gt; مشاركات المجتمع المؤكدة (آخر ٨ ساعات) &gt; الأسعار اليومية الأساسية.</strong>
              <br />
              إذا لم يتم جمع أي بيانات موثوقة لممر تحويل معين في غضون ٢٤ ساعة، فإن ساري ريميت يوضح عدم توفر بيانات مؤكدة بدلاً من إظهار معلومات غير دقيقة.
            </p>
          </section>
        </div>
      )
    }
  };

  const activeContent = content[pageType];
  const Icon = activeContent.icon;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fadeIn">
      {/* Back Button */}
      <div className={`mb-6 flex ${isRtl ? 'justify-end' : 'justify-start'}`}>
        <SDSButton
          onClick={() => setActiveTab('landing')}
          variant="secondary"
          size="sm"
          icon={isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          iconPosition={isRtl ? 'right' : 'left'}
        >
          {isRtl ? 'العودة للرئيسية' : 'Back to Home'}
        </SDSButton>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Header decoration banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 sm:p-8 text-white text-left relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRtl ? 'sm:flex-row-reverse text-right' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl text-emerald-400 border border-white/5 shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight">
                  {isRtl ? activeContent.titleAr : activeContent.titleEn}
                </h1>
                <p className="text-xs text-slate-300 font-mono mt-1 font-bold">
                  {isRtl ? activeContent.lastUpdatedAr : activeContent.lastUpdatedEn}
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-slate-300 px-3 py-1 bg-white/5 border border-white/5 rounded-full uppercase tracking-wider font-mono shrink-0">
              {isRtl ? 'وثيقة رسمية' : 'Official Document'}
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8">
          {isRtl ? activeContent.renderAr() : activeContent.renderEn()}
        </div>
      </div>
    </div>
  );
}
