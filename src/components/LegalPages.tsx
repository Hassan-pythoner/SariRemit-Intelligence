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
      lastUpdatedEn: "Last updated: July 10, 2026",
      lastUpdatedAr: "آخر تحديث: ١٠ يوليو ٢٠٢٦",
      renderEn: () => (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
          <p className="font-semibold text-slate-900 text-base">
            At SariRemit, we prioritize the privacy and security of our community members, especially the hardworking expatriates in Saudi Arabia. This policy explains what information we collect, how it is used, and how we protect it.
          </p>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">1. Information We Collect</h3>
            <p>
              We only collect information necessary to provide remittance intelligence and comparison analytics:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Credentials:</strong> Your name, email address, phone number, and password when you register.</li>
              <li><strong>Preferences:</strong> Your primary destination countries, currencies, and preferred transfer channels.</li>
              <li><strong>Activity Logs:</strong> Recorded transfers and estimated savings you enter to keep track of your personal savings history.</li>
              <li><strong>Crowd-Sourced Rate Submissions:</strong> Uploaded rate screenshots, exchange rates, and fee data that you choose to share to help others.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">2. How We Use Your Information</h3>
            <p>
              Your data is never sold or traded. We use it strictly to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Allow you to access personalized features such as savings tracking, custom rate alerts, and community contributions.</li>
              <li>Calculate and aggregate average crowd-sourced rates in our Rate Resolution Engine (RRE) anonymously.</li>
              <li>Verify the authenticity of community submissions.</li>
              <li>Improve platform performance and user experience.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">3. No Financial Assets or Transaction Processing</h3>
            <p>
              <strong>SariRemit is not a money transfer operator, bank, or financial institution.</strong> We do not hold, receive, or process any funds or transfers. Consequently, we never collect credit card details, bank account numbers, or money-sending transactions.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">4. Data Security</h3>
            <p>
              We implement industry-standard encryption and security measures to guard your personal credentials from unauthorized access, modification, or disclosure. We use secure cloud databases and secure hashing of passwords.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">5. Contact Us</h3>
            <p>
              If you have any questions or concerns about your data, please contact us at <span className="font-bold text-emerald-650">support@sariremit.com</span>.
            </p>
          </section>
        </div>
      ),
      renderAr: () => (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm text-right">
          <p className="font-semibold text-slate-900 text-base">
            في ساري ريميت، نضع خصوصية وأمان أعضاء مجتمعنا، وخاصة المغتربين الكادحين في المملكة العربية السعودية، على رأس أولوياتنا. توضح هذه السياسة البيانات التي نجمعها، وكيف نستخدمها، وكيف نحميها.
          </p>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">١. المعلومات التي نجمعها</h3>
            <p>
              نحن نجمع فقط المعلومات الضرورية لتقديم تحليلات مقارنة أسعار الصرف والتوفير:
            </p>
            <ul className="list-disc pr-5 space-y-1">
              <li><strong>بيانات الحساب:</strong> الاسم، والبريد الإلكتروني، ورقم الهاتف، وكلمة المرور عند تسجيلك.</li>
              <li><strong>التفضيلات:</strong> بلد التحويل المفضل، العملة، وقنوات التحويل المفضلة لديك.</li>
              <li><strong>سجلات النشاط:</strong> سجل التحويلات التي تدونها والوفر المتوقع لمساعدتك في تتبع مدخراتك الشخصية.</li>
              <li><strong>مشاركات الأسعار:</strong> لقطات الشاشة المرفوعة لتأكيد الأسعار، وأسعار الصرف، والرسوم التي تختار مشاركتها لمساعدة الآخرين.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٢. كيف نستخدم معلوماتك</h3>
            <p>
              لا يتم بيع بياناتك أو المتاجرة بها أبداً. نحن نستخدمها بدقة من أجل:
            </p>
            <ul className="list-disc pr-5 space-y-1">
              <li>تمكينك من الوصول إلى الميزات المخصصة مثل تتبع الوفر، وتنبيهات الأسعار، والمشاركات المجتمعية.</li>
              <li>حساب ودمج معدلات الأسعار التشاركية في محرك تحديد الأسعار (RRE) بشكل مجهول الهوية.</li>
              <li>التحقق من صحة مشاركات المجتمع.</li>
              <li>تحسين أداء المنصة وتجربة المستخدم.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٣. لا نقوم بمعالجة المعاملات المالية</h3>
            <p>
              <strong>ساري ريميت ليس مشغلاً لتحويل الأموال أو بنكاً أو مؤسسة مالية.</strong> نحن لا نحتفظ بأي أموال أو نقوم بمعالجتها. وبالتالي، لا نطلب أو نجمع أبداً تفاصيل بطاقات الائتمان أو أرقام الحسابات البنكية.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٤. أمن البيانات</h3>
            <p>
              نحن نطبق معايير وتدابير أمنية متوافقة مع معايير الصناعة لحماية بياناتك الشخصية من الوصول غير المصرح به أو التعديل أو الإفصاح. نستخدم قواعد بيانات سحابية مشفرة وآمنة.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٥. اتصل بنا</h3>
            <p>
              إذا كانت لديك أي أسئلة أو استفسارات حول بياناتك، يرجى التواصل معنا عبر البريد الإلكتروني <span className="font-bold text-emerald-650">support@sariremit.com</span>.
            </p>
          </section>
        </div>
      )
    },
    'terms-of-use': {
      titleEn: "Terms of Use",
      titleAr: "شروط الاستخدام",
      icon: FileText,
      lastUpdatedEn: "Last updated: July 10, 2026",
      lastUpdatedAr: "آخر تحديث: ١٠ يوليو ٢٠٢٦",
      renderEn: () => (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
          <p className="font-semibold text-slate-900 text-base">
            Welcome to SariRemit. By using our website and platform, you agree to these Terms of Use. Please read them carefully.
          </p>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">1. Description of Service</h3>
            <p>
              SariRemit is an independent decision-support platform designed to compare exchange rates, fees, and value-added tax (VAT) of major money transfer operators and digital wallets in Saudi Arabia.
              <strong> SariRemit does not directly transfer money, provide financial advice, or process any transactions.</strong>
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">2. Accuracy and Use of Information</h3>
            <p>
              All rates, fees, and intelligence ratings are displayed for informational purposes only. While we employ rigorous crowdsourcing, verification filters, and the Rate Resolution Engine (RRE) to provide the freshest estimates, rates change dynamically. You are strongly advised to check the final parameters directly inside your chosen wallet app before completing any money transfer.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">3. Community Submissions</h3>
            <p>
              By uploading a screenshot or submitting rate parameters, you guarantee that:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The information is authentic and represents an actual transaction attempt or rate check.</li>
              <li>The screenshot has not been digitally altered, forged, or edited.</li>
              <li>You grant SariRemit an absolute, royalty-free, perpetual right to utilize and aggregate the data.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">4. Prohibited Uses</h3>
            <p>
              You agree not to upload spam, submit deliberately false or misleading rate information, create multiple fake accounts, attempt to breach our security filters, or defame any financial provider or individual.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">5. Limitation of Liability</h3>
            <p>
              SariRemit, its founders, and contributors are not liable for any financial losses, transfer delays, transaction failures, or rate discrepancies arising from your use of the platform or the operators we compare.
            </p>
          </section>
        </div>
      ),
      renderAr: () => (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm text-right">
          <p className="font-semibold text-slate-900 text-base">
            مرحباً بكم في ساري ريميت. باستخدامكم لموقعنا ومنصتنا، فإنكم توافقون على شروط الاستخدام هذه. يرجى قراءتها بعناية.
          </p>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">١. وصف الخدمة</h3>
            <p>
              ساري ريميت هي منصة مستقلة لدعم القرار مصممة لمقارنة أسعار الصرف، والرسوم، وضريبة القيمة المضافة (VAT) لأهم قنوات ومحافظ تحويل الأموال الرقمية في المملكة العربية السعودية.
              <strong> لا يقوم ساري ريميت بتحويل الأموال مباشرة، ولا يقدم مشورة مالية، ولا يعالج أي معاملات مالية.</strong>
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٢. دقة المعلومات واستخدامها</h3>
            <p>
              يتم عرض جميع أسعار الصرف والرسوم لأغراض إعلامية فقط. على الرغم من أننا نستخدم تدقيقاً صارماً ومحركاً متقدماً (RRE) لتوفير أحدث التقديرات، إلا أن الأسعار تتغير باستمرار. يُنصح بشدة بالتحقق من التفاصيل النهائية مباشرة من داخل تطبيق المحفظة المختار قبل إتمام أي عملية تحويل للأموال.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٣. مشاركات المجتمع</h3>
            <p>
              عند تحميل لقطة شاشة أو تقديم بيانات الأسعار، فإنك تضمن ما يلي:
            </p>
            <ul className="list-disc pr-5 space-y-1">
              <li>أن المعلومات حقيقية وتمثل محاولة تحويل فعلية أو استعلام مباشر.</li>
              <li>أن لقطة الشاشة لم يتم تعديلها أو تزويرها رقمياً بأي شكل من الأشكال.</li>
              <li>أنك تمنح ساري ريميت حقاً كاملاً في استخدام هذه البيانات ودمجها بشكل مجهول الهوية.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٤. الاستخدامات المحظورة</h3>
            <p>
              أنت توافق على عدم إرسال مشاركات عشوائية (Spam)، أو تقديم أسعار مضللة أو خاطئة عمداً، أو إنشاء حسابات وهمية متعددة، أو محاولة اختراق فلاتر الأمان الخاصة بنا.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">٥. حدود المسؤولية</h3>
            <p>
              لا يتحمل ساري ريميت أو مؤسسوه أو المساهمون فيه أي مسؤولية عن أي خسائر مالية، أو تأخر في التحويلات، أو فشل المعاملات، أو اختلافات الأسعار الناتجة عن استخدامك للمنصة أو المشغلين الذين نقارن بينهم.
            </p>
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
