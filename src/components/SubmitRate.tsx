import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { CORRIDORS, PROVIDERS } from '../data/mockData';
import { ProviderId, CorridorId, CrowdsourcedRate, CommunityTransferVerification } from '../types';
import { 
  PlusCircle, UploadCloud, Info, CheckCircle, FileText, ArrowRight, ArrowLeft,
  AlertCircle, ShieldAlert, Award, FileSpreadsheet, Sparkles, ThumbsUp, KeyRound, ShieldCheck, Inbox, Shield, HelpCircle
} from 'lucide-react';
import { submitCommunityTransferVerification, uploadScreenshot, trackEvent } from '../lib/firebase';

interface SubmitRateProps {
  addNewSubmission: (sub: Omit<CrowdsourcedRate, 'id' | 'timestamp' | 'votes' | 'isVerified'> & { screenshot?: File }) => void;
  recentSubmissions: CrowdsourcedRate[];
  upvoteSubmission: (id: string) => void;
  verifySubmission: (id: string) => void;
  userSession: { id?: string; name: string; email: string; homeCountry: CorridorId; isGuest?: boolean } | null;
  onOpenAuthModal: () => void;
}

export const SubmitRate: React.FC<SubmitRateProps> = ({
  addNewSubmission,
  recentSubmissions,
  upvoteSubmission,
  verifySubmission,
  userSession,
  onOpenAuthModal,
}) => {
  const { t, language, isRtl } = useLanguage();
  const isEn = language === 'en';

  // Multi-step state: 1 = Provider, 2 = Corridor, 3 = Details, 4 = Screenshot, 5 = Success
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [providerId, setProviderId] = useState<ProviderId>('urpay');
  const [corridorId, setCorridorId] = useState<CorridorId>('PK');
  const [amountSent, setAmountSent] = useState<string>('1000');
  const [exchangeRate, setExchangeRate] = useState<string>('74.5');
  const [transferFee, setTransferFee] = useState<string>('8.0');
  const [vat, setVat] = useState<string>('1.2');
  const [additionalCharges, setAdditionalCharges] = useState<string>('0');
  const [receiveMethod, setReceiveMethod] = useState<'wallet' | 'bank' | 'cash'>('wallet');
  
  // Drag & drop screenshot files
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interactive help toggle
  const [showHelp, setShowHelp] = useState(false);

  // Success message states
  const [errorMsg, setErrorMsg] = useState('');

  // Fire tracking on step start
  useEffect(() => {
    if (step === 1) {
      trackEvent('verification_started', { page: 'verify_transfer', step: 1 });
    }
  }, [step]);

  // Handle file select
  const handleFileChange = (file: File) => {
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'pdf'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (!allowedExtensions.includes(fileExtension)) {
      setErrorMsg(
        isEn 
          ? 'Invalid file format. Please upload PNG, JPG, JPEG, or PDF.' 
          : 'صيغة ملف غير صالحة. يرجى تحميل ملف PNG أو JPG أو JPEG أو PDF.'
      );
      trackEvent('verification_rejected', { reason: 'invalid_file_format', file_name: file.name });
      return;
    }

    // Max size 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg(
        isEn 
          ? 'File is too large. Maximum size is 10MB.' 
          : 'حجم الملف كبير جداً. الحد الأقصى هو ١٠ ميجابايت.'
      );
      trackEvent('verification_rejected', { reason: 'file_too_large', file_size: file.size });
      return;
    }

    setErrorMsg('');
    setScreenshotFile(file);
    trackEvent('screenshot_uploaded', { file_name: file.name, file_size: file.size });

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // For PDF show a placeholder preview icon
      setScreenshotPreview('pdf_placeholder');
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Safe parsed values
  const parsedAmount = Math.max(0, Number(amountSent) || 0);
  const parsedRate = Math.max(0, Number(exchangeRate) || 0);
  const parsedFee = Math.max(0, Number(transferFee) || 0);
  const parsedVat = Math.max(0, Number(vat) || 0);
  const parsedCharges = Math.max(0, Number(additionalCharges) || 0);

  // Auto-calculate recipient payout
  const calculatedRecipientAmount = Math.max(0, (parsedAmount - parsedFee - parsedVat - parsedCharges) * parsedRate);

  // Checklist Validation
  const isFormComplete = 
    providerId && 
    corridorId && 
    parsedAmount > 0 && 
    parsedRate > 0 && 
    parsedFee >= 0 && 
    parsedVat > 0 && 
    screenshotFile !== null;

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormComplete) {
      setErrorMsg(
        isEn 
          ? 'Please complete all required fields and upload a screenshot.' 
          : 'يرجى إكمال جميع الحقول المطلوبة وتحميل لقطة الشاشة.'
      );
      return;
    }

    setIsSubmitting(true);
    const verificationId = `ver-${Date.now()}`;
    const timestampStr = new Date().toISOString();

    let finalScreenshotUrl = screenshotPreview || '';
    let storagePath = '';
    
    if (screenshotFile) {
      storagePath = `community_transfer_verifications/${verificationId}_${screenshotFile.name}`;
      try {
        finalScreenshotUrl = await uploadScreenshot(screenshotFile, storagePath);
      } catch (err) {
        console.warn("Error uploading screenshot, fallback to local URL:", err);
      }
    }

    const selectedCorrObj = CORRIDORS.find(c => c.id === corridorId) || CORRIDORS[0];
    const selectedProviderObj = PROVIDERS.find(p => p.id === providerId) || PROVIDERS[0];

    const newVerification: CommunityTransferVerification = {
      id: verificationId,
      userId: userSession?.id || 'guest_user',
      userEmail: userSession?.email || 'guest@example.com',
      sessionId: sessionStorage.getItem('sariremit_session_id') || 'session_xyz',
      providerId: providerId,
      providerName: selectedProviderObj.name,
      corridor: corridorId,
      destinationCountry: selectedCorrObj.nameEn,
      receiveCurrency: selectedCorrObj.currencyCode,
      amountSent: parsedAmount,
      exchangeRate: parsedRate,
      transferFee: parsedFee,
      vatAmount: parsedVat,
      additionalCharges: parsedCharges,
      receiveMethod: receiveMethod,
      recipientAmount: calculatedRecipientAmount,
      screenshotUrl: finalScreenshotUrl,
      screenshotStoragePath: storagePath,
      submissionStatus: "pending",
      verificationStatus: "pending_review",
      reviewedBy: null,
      reviewNotes: "",
      createdAt: timestampStr,
      updatedAt: timestampStr,

      // Compatibility fields with snake_case
      user_id: userSession?.id || 'guest_user',
      session_id: sessionStorage.getItem('sariremit_session_id') || 'session_xyz',
      provider: providerId,
      amount_sent: parsedAmount,
      exchange_rate: parsedRate,
      transfer_fee: parsedFee,
      vat: parsedVat,
      additional_charges: parsedCharges,
      receive_method: receiveMethod,
      recipient_amount: calculatedRecipientAmount,
      screenshot_url: finalScreenshotUrl,
      submission_status: "pending",
      verification_status: "pending_review",
      created_at: timestampStr,
      updated_at: timestampStr
    };

    // Save Verification locally and push to Firestore
    await submitCommunityTransferVerification(newVerification);

    // Track completed verification event
    trackEvent('verification_completed', {
      verification_id: verificationId,
      provider: providerId,
      corridor: corridorId,
      amount: parsedAmount,
      exchange_rate: parsedRate,
      transfer_fee: parsedFee,
      vat: parsedVat
    });

    // Also call existing app state sync to display in global lists
    addNewSubmission({
      providerId,
      corridorId,
      amountSar: parsedAmount,
      exchangeRate: parsedRate,
      fee: parsedFee,
      recipientAmount: calculatedRecipientAmount,
      submittedBy: userSession ? userSession.name : 'Expat Member',
      screenshotUrl: finalScreenshotUrl && finalScreenshotUrl !== 'pdf_placeholder' ? finalScreenshotUrl : undefined
    });

    setIsSubmitting(false);
    // Move to success step
    setStep(5);
  };

  const selectedCorr = CORRIDORS.find(c => c.id === corridorId) || CORRIDORS[0];
  const selectedProvider = PROVIDERS.find(p => p.id === providerId) || PROVIDERS[0];

  return (
    <div className="space-y-8 pb-16 text-white animate-fade-in max-w-4xl mx-auto">
      
      {/* Page Header */}
      <div className="space-y-2 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00C16A]/10 border border-[#00C16A]/20 text-[10px] font-bold text-[#00E07A] rounded-full font-mono uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isEn ? 'Trust-First Community Verification' : 'توثيق مجتمعي موثوق'}</span>
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          {isEn ? 'Verify a Transfer' : 'توثيق عملية تحويل'}
        </h1>
        <p className="text-[#AFC4D8] text-sm max-w-2xl mx-auto leading-relaxed">
          {isEn 
            ? "Submit evidence of your completed remittance to help keep SariRemit's exchange rates 100% accurate and gain trust points."
            : 'شارك إثبات حوالتك المكتملة لمساعدة مجتمعنا في الحفاظ على دقة أسعار الصرف بنسبة ١٠٠٪ والحصول على نقاط الثقة.'}
        </p>
      </div>

      {/* Auth Gate for non-logged-in users */}
      {!userSession ? (
        <div className="max-w-xl mx-auto bg-[#0B1E35] border border-white/5 p-8 rounded-[28px] shadow-2xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#00E07A]/10 border border-[#00E07A]/25 flex items-center justify-center text-[#00E07A] shadow-lg">
              <KeyRound className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#00E07A]/10 border border-[#00E07A]/20 text-[9px] font-bold text-[#00E07A] rounded-full font-mono uppercase tracking-wider">
              {isEn ? 'MEMBERS ONLY' : 'للأعضاء فقط'}
            </span>
            <h3 className="text-xl font-extrabold text-white">
              {isEn ? 'Verify Transfer Evidence' : 'توثيق حوالتك المكتملة'}
            </h3>
            <p className="text-xs text-[#AFC4D8] max-w-sm mx-auto leading-relaxed">
              {isEn
                ? 'To protect community accuracy and maintain elite trust indexes, only registered members can verify transfers. Create an account in seconds!'
                : 'لحماية دقة بيانات المجتمع والأسعار المعتمدة، تقتصر كتابة وتوثيق الأسعار على الأعضاء المسجلين. يستغرق التسجيل ثوانٍ معدودة!'}
            </p>
          </div>

          <div className="pt-2 max-w-xs mx-auto space-y-3">
            <button
              id="verify-transfer-gate-btn"
              onClick={onOpenAuthModal}
              className="w-full py-3.5 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
            >
              <span>{isEn ? 'Sign In / Register Now' : 'تسجيل دخول / إنشاء حساب'}</span>
              {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#7E96AA]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00E07A]" />
              <span>{isEn ? 'Earn +15 Expat Trust Points instantly' : 'احصل على +١٥ نقطة موثوقية فوراً'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0B1E35] border border-white/5 rounded-[28px] shadow-2xl overflow-hidden">
          
          {/* Progress Indicator Steps (Visible only for non-success steps) */}
          {step < 5 && (
            <div className="bg-[#071326]/60 border-b border-white/5 px-6 py-5">
              <div className="flex justify-between items-center max-w-lg mx-auto relative">
                {/* Connecting background line */}
                <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-white/5 -translate-y-1/2 z-0" />
                <div 
                  className="absolute left-0 top-1/2 h-[2px] bg-[#00E07A] -translate-y-1/2 z-0 transition-all duration-300" 
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                />

                {[1, 2, 3, 4].map((num) => {
                  const isActive = step === num;
                  const isCompleted = step > num;
                  const stepLabel = [
                    isEn ? 'Provider' : 'المحفظة',
                    isEn ? 'Corridor' : 'الوجهة',
                    isEn ? 'Details' : 'التفاصيل',
                    isEn ? 'Evidence' : 'الإثبات'
                  ][num - 1];

                  return (
                    <div key={num} className="relative z-10 flex flex-col items-center gap-1.5">
                      <button 
                        type="button"
                        onClick={() => {
                          if (isCompleted || num < step) {
                            setStep(num);
                          }
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 ${
                          isActive 
                            ? 'bg-[#00E07A] text-[#071326] shadow-[0_0_12px_#00E07A]' 
                            : isCompleted 
                              ? 'bg-amber-400 text-[#071326]' 
                              : 'bg-[#10263D] text-[#7E96AA] border border-white/5'
                        }`}
                      >
                        {isCompleted ? '✓' : num}
                      </button>
                      <span className={`text-[10px] font-bold tracking-wider uppercase font-sans ${
                        isActive ? 'text-[#00E07A]' : isCompleted ? 'text-amber-400' : 'text-[#7E96AA]'
                      }`}>
                        {stepLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form and step content */}
          <div className="p-6 md:p-8 space-y-6">

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-2 animate-fade-in text-xs font-bold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Choose Provider */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">
                    {isEn ? 'Select Remittance Channel' : 'اختر قناة تحويل الأموال'}
                  </h3>
                  <p className="text-xs text-[#7E96AA]">
                    {isEn ? 'Choose the wallet provider or bank used for this transfer.' : 'حدد المحفظة الرقمية أو البنك المستخدم في التحويل.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PROVIDERS.map((p) => {
                    const isSelected = providerId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProviderId(p.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#00E07A]/50 bg-[#00E07A]/5 ring-2 ring-[#00E07A]/20'
                            : 'border-white/5 bg-[#071326] hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-[#071326] ${p.logoColor} shadow-md mb-2`}>
                          {p.name.charAt(0)}
                        </div>
                        <span className="text-xs font-extrabold text-white block">{p.name}</span>
                        <span className="text-[10px] text-[#7E96AA] mt-1">⭐️ {p.rating}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-end border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-2.5 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                  >
                    <span>{isEn ? 'Continue' : 'متابعة'}</span>
                    {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Choose Corridor */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">
                    {isEn ? 'Select Destination Corridor' : 'اختر دولة الوجهة'}
                  </h3>
                  <p className="text-xs text-[#7E96AA]">
                    {isEn ? 'Which sending corridor was this remittance made to?' : 'ما هي الدولة المستلمة التي تم تحويل الأموال إليها؟'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CORRIDORS.map((c) => {
                    const isSelected = corridorId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCorridorId(c.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#00E07A]/50 bg-[#00E07A]/5 ring-2 ring-[#00E07A]/20'
                            : 'border-white/5 bg-[#071326] hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <span className="text-3xl mb-2">{c.flag}</span>
                        <span className="text-xs font-bold text-white block">{isEn ? c.nameEn : c.nameAr}</span>
                        <span className="text-[10px] text-[#7E96AA] font-mono mt-0.5">{c.currencyCode}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-between border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                  >
                    {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    <span>{isEn ? 'Back' : 'رجوع'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-2.5 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                  >
                    <span>{isEn ? 'Continue' : 'متابعة'}</span>
                    {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Transfer Details */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">
                    {isEn ? 'Remittance Details' : 'تفاصيل الحوالة المالية'}
                  </h3>
                  <p className="text-xs text-[#7E96AA]">
                    {isEn ? 'Enter the precise values as displayed on your transfer receipt.' : 'أدخل البيانات الدقيقة كما تظهر في إيصال التحويل الخاص بك.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#7E96AA] uppercase tracking-widest">
                      {isEn ? 'Sent Amount (SAR) *' : 'المبلغ المرسل (ريال سعودي) *'}
                    </label>
                    <input
                      type="number"
                      id="details-amount"
                      value={amountSent}
                      onChange={(e) => setAmountSent(e.target.value)}
                      className="w-full bg-[#071326] text-white font-mono text-sm px-3.5 py-2.5 rounded-xl border border-white/5 focus:outline-none focus:border-[#00C16A]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#7E96AA] uppercase tracking-widest">
                      {isEn ? 'Exchange Rate (1 SAR = X) *' : 'سعر الصرف (١ ريال = X) *'}
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      id="details-rate"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      className="w-full bg-[#071326] text-white font-mono text-sm px-3.5 py-2.5 rounded-xl border border-white/5 focus:outline-none focus:border-[#00C16A]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#7E96AA] uppercase tracking-widest">
                      {isEn ? 'Transfer Fee (SAR) *' : 'رسوم التحويل (ريال سعودي) *'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      id="details-fee"
                      value={transferFee}
                      onChange={(e) => setTransferFee(e.target.value)}
                      className="w-full bg-[#071326] text-white font-mono text-sm px-3.5 py-2.5 rounded-xl border border-white/5 focus:outline-none focus:border-[#00C16A]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#7E96AA] uppercase tracking-widest">
                      {isEn ? 'VAT Amount (SAR) *' : 'ضريبة القيمة المضافة (ريال سعودي) *'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      id="details-vat"
                      value={vat}
                      onChange={(e) => setVat(e.target.value)}
                      className="w-full bg-[#071326] text-white font-mono text-sm px-3.5 py-2.5 rounded-xl border border-white/5 focus:outline-none focus:border-[#00C16A]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#7E96AA] uppercase tracking-widest">
                      {isEn ? 'Additional Charges (SAR) - Optional' : 'رسوم إضافية أخرى (ريال سعودي) - اختياري'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      id="details-additional"
                      value={additionalCharges}
                      onChange={(e) => setAdditionalCharges(e.target.value)}
                      className="w-full bg-[#071326] text-white font-mono text-sm px-3.5 py-2.5 rounded-xl border border-white/5 focus:outline-none focus:border-[#00C16A]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#7E96AA] uppercase tracking-widest">
                      {isEn ? 'Receive Method' : 'طريقة الاستلام'}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 bg-[#071326] p-1 rounded-xl border border-white/5">
                      {(['wallet', 'bank', 'cash'] as const).map((method) => {
                        const isSel = receiveMethod === method;
                        const methodLabel = {
                          wallet: isEn ? 'Wallet' : 'محفظة',
                          bank: isEn ? 'Bank Account' : 'بنك',
                          cash: isEn ? 'Cash Pickup' : 'نقدي'
                        }[method];

                        return (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setReceiveMethod(method)}
                            className={`py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer uppercase ${
                              isSel 
                                ? 'bg-[#00C16A] text-[#071326]' 
                                : 'text-[#7E96AA] hover:text-white'
                            }`}
                          >
                            {methodLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Live Payout Calculations Area */}
                <div className="bg-[#00E07A]/5 border border-[#00E07A]/25 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-[#00E07A] font-extrabold block text-[11px] uppercase tracking-wider font-sans">
                      {isEn ? 'Formula & Net Transferred' : 'معادلة الحساب وصافي المبلغ'}
                    </span>
                    <span className="text-[#AFC4D8] block text-[10px] leading-relaxed">
                      ({parsedAmount} SAR - {parsedFee} Fee - {parsedVat} VAT {parsedCharges > 0 ? `- ${parsedCharges} Additional` : ''}) × {parsedRate} Rate
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-sans uppercase">{isEn ? 'Recipient Receives:' : 'المستلم يحصل على:'}</span>
                    <span className="text-2xl font-black text-[#00E07A] block mt-1">
                      {calculatedRecipientAmount.toLocaleString(undefined, { maximumFractionDigits: 3 })}{' '}
                      {selectedCorr.currencyCode}
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex justify-between border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                  >
                    {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    <span>{isEn ? 'Back' : 'رجوع'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (parsedAmount <= 0 || parsedRate <= 0 || parsedVat < 0) {
                        setErrorMsg(isEn ? 'Amount, Rate, and VAT must be greater than zero.' : 'يجب أن يكون المبلغ وسعر الصرف والضريبة أكبر من الصفر.');
                        return;
                      }
                      setErrorMsg('');
                      setStep(4);
                    }}
                    className="px-6 py-2.5 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                  >
                    <span>{isEn ? 'Continue' : 'متابعة'}</span>
                    {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Upload screenshot evidence */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">
                    {isEn ? 'Upload Proof of Transfer' : 'تحميل إثبات التحويل'}
                  </h3>
                  <p className="text-xs text-[#7E96AA]">
                    {isEn ? 'Attach a screenshot of your digital wallet receipt to complete verification.' : 'أرفق لقطة شاشة لإيصال محفظتك الرقمية لإكمال التوثيق.'}
                  </p>
                </div>

                {/* Educational Section - Why Require Screenshot? */}
                <div className="bg-[#10263D] border border-white/5 rounded-2xl p-5 space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowHelp(!showHelp)}
                    className="w-full flex justify-between items-center text-xs font-extrabold text-[#00E07A] uppercase tracking-wider cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-4.5 h-4.5" />
                      <span>{isEn ? 'Why do we require a screenshot?' : 'لماذا نطلب لقطة شاشة؟'}</span>
                    </span>
                    <span className="text-lg">{showHelp ? '−' : '+'}</span>
                  </button>
                  
                  {showHelp && (
                    <p className="text-xs text-[#AFC4D8] leading-relaxed animate-fade-in">
                      {isEn 
                        ? "Community financial intelligence is only useful when trustworthy. SariRemit verifies every single submission against a real mobile screenshot to eliminate fake rates, stale information, and bank manipulation. This guarantees maximum reliability for all expats."
                        : 'الذكاء المالي للمجتمع يكون مفيداً فقط عندما يكون موثوقاً به بالكامل. يقوم ساري ريميت بالتحقق من كل مشاركة بمطابقتها مع لقطة شاشة حقيقية لاستبعاد الأسعار المزيفة، والبيانات القديمة، وتلاعب البنوك.'}
                    </p>
                  )}
                </div>

                {/* Privacy Notice */}
                <div className="bg-amber-400/5 border border-amber-400/25 rounded-2xl p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <span className="font-extrabold text-amber-400 block uppercase tracking-wider">
                      {isEn ? '🔒 Privacy Protected & Encrypted' : '🔒 الخصوصية محمية ومشفرة'}
                    </span>
                    <p className="text-[#AFC4D8] leading-relaxed">
                      {isEn 
                        ? 'SariRemit automatically blurs or ignores sensitive personal details (such as names, bank account balances, or account numbers). We only extract the sending channel, corridor, rate, fees, VAT, and timestamp to audit the transaction.'
                        : 'يقوم ساري ريميت تلقائياً بحجب وتجاهل التفاصيل الشخصية الحساسة (مثل الأسماء، أو أرصدة الحسابات البنكية). نقوم فقط باستخراج قناة الإرسال، والوجهة، وسعر الصرف، والرسوم، والضريبة.'}
                    </p>
                  </div>
                </div>

                {/* Drag and drop Area */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#7E96AA] uppercase tracking-widest">
                    {isEn ? 'Screenshot / Receipt Evidence (Required) *' : 'لقطة الشاشة / إثبات الإيصال (مطلوب) *'}
                  </label>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[20px] p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 min-h-[180px] ${
                      isDragOver
                        ? 'border-[#00E07A] bg-[#00E07A]/10'
                        : 'border-white/10 bg-[#071326] hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="file"
                      id="details-screenshot-file"
                      ref={fileInputRef}
                      onChange={onFileInputChange}
                      accept="image/png, image/jpeg, image/jpg, application/pdf"
                      className="hidden"
                    />

                    {screenshotPreview ? (
                      <div className="space-y-3 w-full max-w-xs relative">
                        {screenshotPreview === 'pdf_placeholder' ? (
                          <div className="w-16 h-16 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-rose-400 mx-auto">
                            <FileText className="w-10 h-10" />
                          </div>
                        ) : (
                          <img
                            src={screenshotPreview}
                            alt="Verification receipt proof"
                            referrerPolicy="no-referrer"
                            className="max-h-32 mx-auto rounded-lg object-contain border border-white/10 shadow-lg"
                          />
                        )}
                        <div className="text-[11px] text-[#00E07A] font-extrabold font-mono flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[200px]">{screenshotFile?.name}</span>
                        </div>
                        <button
                          type="button"
                          id="remove-verification-screenshot"
                          onClick={(e) => {
                            e.stopPropagation();
                            setScreenshotFile(null);
                            setScreenshotPreview(null);
                          }}
                          className="absolute -top-2 -right-2 bg-slate-900 border border-white/15 text-white rounded-full p-1.5 text-xs transition-colors hover:bg-red-500/10 cursor-pointer shadow-md"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-10 h-10 text-[#7E96AA]" />
                        <p className="text-xs font-bold text-white">
                          {isEn ? 'Drag and drop your screenshot here, or browse' : 'اسحب وأفلت لقطة الشاشة هنا، أو تصفح الملفات'}
                        </p>
                        <p className="text-[10px] text-[#7E96AA] leading-normal font-medium">
                          Supports PNG, JPG, JPEG, PDF • Maximum size 10MB
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Submit button with checklist check */}
                <div className="pt-4 border-t border-white/5 space-y-4">
                  
                  {/* Submission Checklist Display */}
                  <div className="bg-[#071326] p-4 rounded-xl border border-white/5 text-[11px] text-[#AFC4D8] space-y-2">
                    <span className="font-extrabold text-white block uppercase tracking-wider text-[9px] mb-1">
                      {isEn ? 'Verification Submission Checklist' : 'قائمة مراجعة متطلبات التوثيق'}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={providerId ? 'text-[#00E07A]' : 'text-[#7E96AA]'}>{providerId ? '✓' : '○'}</span>
                        <span>{isEn ? 'Wallet Provider' : 'تحديد المحفظة'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={corridorId ? 'text-[#00E07A]' : 'text-[#7E96AA]'}>{corridorId ? '✓' : '○'}</span>
                        <span>{isEn ? 'Sending Corridor' : 'تحديد الوجهة'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={parsedAmount > 0 && parsedRate > 0 && parsedVat > 0 ? 'text-[#00E07A]' : 'text-[#7E96AA]'}>
                          {parsedAmount > 0 && parsedRate > 0 && parsedVat > 0 ? '✓' : '○'}
                        </span>
                        <span>{isEn ? 'Rates, Fee, VAT' : 'الأسعار والرسوم والضريبة'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={screenshotFile ? 'text-[#00E07A]' : 'text-[#7E96AA]'}>{screenshotFile ? '✓' : '○'}</span>
                        <span>{isEn ? 'Evidence Receipt' : 'إرفاق الإيصال'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                    >
                      {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                      <span>{isEn ? 'Back' : 'رجوع'}</span>
                    </button>

                    <button
                      type="button"
                      id="verify-transfer-submit-btn"
                      disabled={!isFormComplete || isSubmitting}
                      onClick={handleSubmit}
                      className={`px-8 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                        isFormComplete && !isSubmitting
                          ? 'bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] shadow-lg shadow-[#00C16A]/10' 
                          : 'bg-slate-800 text-[#7E96AA] border border-white/5 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-[#071326] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>{isSubmitting ? (isEn ? 'Submitting...' : 'جاري التقديم...') : (isEn ? 'Verify Transfer' : 'توثيق الحوالة')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Success & Community Impact Screen */}
            {step === 5 && (
              <div className="text-center py-8 space-y-6 max-w-lg mx-auto animate-fade-in">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-[#00E07A]/10 border border-[#00E07A]/30 flex items-center justify-center text-[#00E07A] animate-pulse">
                    <CheckCircle className="w-12 h-12 stroke-[1.5]" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-[#00E07A]/10 border border-[#00E07A]/20 p-3.5 rounded-xl text-[#00E07A] font-bold text-xs max-w-sm mx-auto">
                    {isEn ? 'Transfer submitted for verification.' : 'تم تقديم الحوالة للتحقق والاعتماد.'}
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00E07A]/15 border border-[#00E07A]/30 text-[10px] font-black text-[#00E07A] rounded-full font-mono uppercase tracking-wider">
                    🎉 +15 Expat Trust Points Earned
                  </span>
                  <h2 className="text-2xl font-black text-white leading-tight">
                    {isEn ? 'Evidence Submitted Successfully!' : 'تم تقديم إثبات التوثيق بنجاح!'}
                  </h2>
                  <p className="text-xs text-[#AFC4D8] leading-relaxed">
                    {isEn 
                      ? "Thank you! Your verified transfer will help strengthen SariRemit's community intelligence. Our moderators are auditing the screenshot. Check your Profile page under 'My Verified Transfers' to monitor its real-time approval status."
                      : 'شكراً لك! سيساعد إثبات حوالتك الموثقة في تعزيز دقة بيانات المجتمع في ساري ريميت. يقوم المشرفون الآن بمراجعة لقطة الشاشة. تفقد صفحة ملفك الشخصي لمتابعة حالة الاعتماد.'}
                  </p>
                </div>

                {/* Visual Impact summary card */}
                <div className="bg-[#071326] border border-white/5 rounded-2xl p-5 text-left rtl:text-right space-y-3 text-xs">
                  <span className="text-[10px] text-[#00E07A] font-extrabold uppercase tracking-widest font-mono">
                    {isEn ? 'Submission Summary' : 'ملخص التوثيق المرسل'}
                  </span>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-white/5 pt-3 text-[#B8C7D9]">
                    <div className="flex justify-between items-center text-xs">
                      <span>{isEn ? 'Channel:' : 'القناة:'}</span>
                      <strong className="text-white uppercase font-bold">{selectedProvider.name}</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>{isEn ? 'Corridor:' : 'الوجهة:'}</span>
                      <strong className="text-white font-bold">{selectedCorr.flag} {selectedCorr.id}</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>{isEn ? 'Sent Amount:' : 'المبلغ المرسل:'}</span>
                      <strong className="text-white font-mono font-bold">{parsedAmount} SAR</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>{isEn ? 'Exchange Rate:' : 'سعر الصرف:'}</span>
                      <strong className="text-white font-mono font-bold">{parsedRate}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setScreenshotFile(null);
                      setScreenshotPreview(null);
                      setAmountSent('1000');
                    }}
                    className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 text-white font-extrabold text-xs rounded-xl transition-all uppercase tracking-wider cursor-pointer"
                  >
                    {isEn ? 'Verify Another Transfer' : 'توثيق حوالة أخرى'}
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
