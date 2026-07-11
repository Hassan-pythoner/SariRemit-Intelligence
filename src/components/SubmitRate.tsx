import React, { useState, useEffect, useRef } from 'react';
import { TranslationDict, Corridor, Provider, RateSubmission } from '../types';
import { CORRIDORS, PROVIDERS } from '../services/ratesService';
import { saveCommunitySubmission, getAuthSession, fetchCommunitySubmissions } from '../services/supabaseService';
import { 
  PlusCircle, Upload, CheckCircle2, ShieldAlert, Sparkles, 
  Trash2, Image as ImageIcon, ArrowRight, ArrowLeft, RefreshCw,
  MapPin, Wallet, Landmark, HelpCircle, Check, Info
} from 'lucide-react';
import { SDSButton, SDSCard, SDSBadge, SDSInput, SDSSelect } from './Sds';

interface SubmitRateProps {
  language: 'en' | 'ar';
  t: TranslationDict;
  onSubmissionSuccess: () => void;
}

export default function SubmitRate({
  language,
  t,
  onSubmissionSuccess,
}: SubmitRateProps) {
  const isRtl = language === 'ar';

  // Relativized time text
  const getRelativeTimeText = (isoString: string) => {
    if (!isoString) return language === 'en' ? 'Recently' : 'مؤخراً';
    const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
    if (mins <= 1) return language === 'en' ? 'Just now' : 'الآن';
    if (mins < 60) return language === 'en' ? `${mins}m ago` : `منذ ${mins} د`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return language === 'en' ? `${hrs}h ago` : `منذ ${hrs} ساعة`;
    return language === 'en' ? 'Recently' : 'مؤخراً';
  };
  
  // Form states
  const [providerId, setProviderId] = useState<string>('stc-pay');
  const [corridorId, setCorridorId] = useState<string>(() => {
    const session = getAuthSession();
    return session.user?.preferredCorridorId || 'sa-pk';
  });
  const [sendAmount, setSendAmount] = useState<number>(1000);
  const [exchangeRate, setExchangeRate] = useState<string>('');
  const [transferFee, setTransferFee] = useState<number>(15);
  const [vatAmount, setVatAmount] = useState<string>(''); // blank = auto compute
  const [otherCosts, setOtherCosts] = useState<string>('0');
  
  // File upload state
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Success & navigation timeline states
  const [activeStep, setActiveStep] = useState<number>(1); // Timeline step (1, 2, 3)
  const [success, setSuccess] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [myRecentSubmissions, setMyRecentSubmissions] = useState<RateSubmission[]>([]);

  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isRefreshingHistory, setIsRefreshingHistory] = useState<boolean>(false);

  // Fetch recent user contributions for live history updates
  const loadSubmissions = () => {
    const session = getAuthSession();
    if (session.user) {
      setIsRefreshingHistory(true);
      fetchCommunitySubmissions()
        .then((allSubmissions) => {
          const filtered: RateSubmission[] = allSubmissions
            .filter(
              s => s.submitted_by_email?.toLowerCase() === session.user?.email.toLowerCase()
            )
            .map(s => ({
              id: s.id,
              providerId: s.provider_id,
              providerName: s.provider_name,
              corridorId: s.corridor_id,
              exchangeRate: s.exchange_rate,
              transferFee: s.transfer_fee,
              sendAmount: s.send_amount,
              receiveAmount: s.receive_amount,
              submittedByEmail: s.submitted_by_email,
              submittedAt: s.submitted_at,
              screenshotName: s.screenshot_name,
              status: s.status,
              vatAmount: s.vat_amount,
              other_costs: s.other_costs
            }));
          setMyRecentSubmissions(filtered);
          setIsRefreshingHistory(false);
        })
        .catch((err) => {
          console.error("Failed to load user submissions in SubmitRate:", err);
          setIsRefreshingHistory(false);
        });
    }
  };

  useEffect(() => {
    loadSubmissions();

    // Set up active automatic liveness polling every 8 seconds
    const interval = setInterval(() => {
      loadSubmissions();
    }, 8000);

    return () => clearInterval(interval);
  }, [success, refreshTrigger]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCorridor = CORRIDORS.find(c => c.id === corridorId) || CORRIDORS[0];
  const activeProvider = PROVIDERS.find(p => p.id === providerId) || PROVIDERS[0];

  // Auto-fill suggested exchange rate when corridor changes
  useEffect(() => {
    setExchangeRate(activeCorridor.baseExchangeRate.toString());
    setTransferFee(activeCorridor.typicalFee);
  }, [corridorId]);

  // Compute recipient amount based on entered rates
  const parsedRate = parseFloat(exchangeRate) || 0;
  const calculatedReceive = sendAmount * parsedRate;

  // File drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setValidationError(language === 'en' ? 'Only images are supported' : 'الرجاء تحميل صور فقط');
      return;
    }
    
    setValidationError('');
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Simulate upload progress
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleNextStep = () => {
    setValidationError('');
    if (activeStep === 1) {
      if (!providerId) {
        setValidationError(language === 'en' ? 'Please select a provider' : 'الرجاء اختيار مزود الخدمة');
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (!exchangeRate || isNaN(parseFloat(exchangeRate)) || parseFloat(exchangeRate) <= 0) {
        setValidationError(language === 'en' ? 'Please enter a valid exchange rate' : 'الرجاء إدخال سعر صرف صحيح');
        return;
      }
      if (sendAmount <= 0) {
        setValidationError(language === 'en' ? 'Please enter a valid send amount' : 'الرجاء إدخال مبلغ إرسال صحيح');
        return;
      }
      setActiveStep(3);
    }
  };

  const handlePrevStep = () => {
    setValidationError('');
    setActiveStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const parsedVat = vatAmount !== '' ? parseFloat(vatAmount) : undefined;
    const parsedOtherCosts = parseFloat(otherCosts) || 0;

    if (parsedVat !== undefined && (isNaN(parsedVat) || parsedVat < 0)) {
      setValidationError(language === 'en' ? 'Please enter a valid VAT amount' : 'الرجاء إدخال ضريبة قيمة مضافة صحيحة');
      return;
    }
    if (isNaN(parsedOtherCosts) || parsedOtherCosts < 0) {
      setValidationError(language === 'en' ? 'Please enter valid other costs' : 'الرجاء إدخال تكاليف أخرى صحيحة');
      return;
    }

    try {
      setIsUploading(true);
      const session = getAuthSession();
      await saveCommunitySubmission({
        provider_id: providerId,
        provider_name: activeProvider.name,
        corridor_id: corridorId,
        exchange_rate: parsedRate,
        transfer_fee: transferFee,
        send_amount: sendAmount,
        receive_amount: calculatedReceive,
        submitted_by_name: session.user?.name || 'Ahmed Hassan',
        submitted_by_email: session.user?.email || 'ahmed.hassan@saudi-expats.com',
        screenshot_name: selectedFile ? selectedFile.name : undefined,
        vat_amount: parsedVat,
        other_costs: parsedOtherCosts,
      });

      setIsUploading(false);
      setSuccess(true);
      onSubmissionSuccess();

      // Reset Form & active step
      setTimeout(() => {
        setSuccess(false);
        setVatAmount('');
        setOtherCosts('0');
        setActiveStep(1);
        removeFile();
      }, 4000);
    } catch (err: any) {
      console.error('Failed to submit rate:', err);
      setValidationError(language === 'en' ? 'Failed to save rate submission. Please try again.' : 'فشل حفظ السعر المرسل. الرجاء المحاولة مجدداً.');
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-6 pb-24 text-sds-text ${isRtl ? 'text-right' : 'text-left'} animate-fadeIn`}>
      
      {/* Page Header */}
      <div className="space-y-1 text-left">
        <h1 className="text-2xl sm:text-3xl font-sans font-black text-white tracking-tight flex items-center gap-2.5">
          <PlusCircle className="w-7 h-7 text-[#10B981] shrink-0" />
          <span>{t.submitRate}</span>
        </h1>
        <p className="text-xs text-sds-text-sec max-w-2xl">
          {t.submitRateDesc}
        </p>
      </div>

      {success ? (
        <div className="bg-[#0C2547] border border-[#10B981]/30 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center mx-auto shadow-md border border-[#10B981]/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-wide">
            {language === 'en' ? 'Thank you, Rate Submitted!' : 'شكراً لك، تم إرسال السعر بنجاح!'}
          </h3>
          <p className="text-xs text-sds-text-sec leading-relaxed">
            {language === 'en' 
              ? "Your rate contribution has been submitted to the SariRemit verification system. Once approved, it will update live for fellow expats."
              : "تم إرسال مساهمتك بنجاح إلى نظام التدقيق. بمجرد الموافقة عليها، سيتم تحديث الأسعار للمغتربين الآخرين."}
          </p>
          <div className="p-4 bg-[#071A35] rounded-xl max-w-sm mx-auto text-xs font-bold text-[#10B981] font-mono border border-sds-border">
            {activeProvider.name} • 1 SAR = {parsedRate} {activeCorridor.currencyCode}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* TIMELINE FORM - LEFT (Col span 7) */}
          <div className="lg:col-span-7 bg-[#0C2547] border border-sds-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sds-lg">
            
            {/* INTERACTIVE TIMELINE HEADER */}
            <div className="relative flex justify-between items-center max-w-md mx-auto mb-6">
              {/* Timeline Connector Line */}
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-sds-border/60 -translate-y-1/2 pointer-events-none" />
              <div 
                className="absolute top-1/2 left-4 h-0.5 bg-[#10B981] -translate-y-1/2 transition-all duration-300 pointer-events-none" 
                style={{ width: activeStep === 1 ? '0%' : activeStep === 2 ? '50%' : '100%' }}
              />

              {/* Step 1 Node */}
              <button 
                type="button"
                onClick={() => setActiveStep(1)}
                className={`relative z-10 w-9 h-9 rounded-full font-black text-xs font-mono transition-all border flex items-center justify-center ${
                  activeStep >= 1 
                    ? 'bg-[#10B981] border-[#10B981] text-[#071A35]' 
                    : 'bg-[#071A35] border-sds-border text-sds-text-sec'
                }`}
              >
                {activeStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wider text-sds-text-sec whitespace-nowrap">
                  Channel
                </span>
              </button>

              {/* Step 2 Node */}
              <button 
                type="button"
                onClick={() => activeStep >= 2 ? setActiveStep(2) : null}
                className={`relative z-10 w-9 h-9 rounded-full font-black text-xs font-mono transition-all border flex items-center justify-center ${
                  activeStep >= 2 
                    ? 'bg-[#10B981] border-[#10B981] text-[#071A35]' 
                    : 'bg-[#071A35] border-sds-border text-sds-text-sec'
                }`}
              >
                {activeStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wider text-sds-text-sec whitespace-nowrap">
                  Rate Info
                </span>
              </button>

              {/* Step 3 Node */}
              <button 
                type="button"
                className={`relative z-10 w-9 h-9 rounded-full font-black text-xs font-mono transition-all border flex items-center justify-center ${
                  activeStep === 3 
                    ? 'bg-[#10B981] border-[#10B981] text-[#071A35]' 
                    : 'bg-[#071A35] border-sds-border text-sds-text-sec'
                }`}
              >
                '3'
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wider text-sds-text-sec whitespace-nowrap">
                  Proof & Submit
                </span>
              </button>
            </div>

            {/* Step Spacer */}
            <div className="pt-6"></div>

            {validationError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 font-bold flex items-center gap-2 text-left">
                <ShieldAlert className="w-4 h-4" />
                <span>{validationError}</span>
              </div>
            )}

            {/* TIMELINE STEP 1: CHANNEL SELECT */}
            {activeStep === 1 && (
              <div className="space-y-5 text-left animate-fadeIn">
                <div className="border-b border-sds-border/60 pb-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">
                    Step 1: Remittance Channel Setup
                  </h3>
                  <p className="text-xs text-sds-text-sec mt-0.5">Which app or provider are you currently viewing today?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Provider Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                      {t.provider}
                    </label>
                    <select
                      value={providerId}
                      onChange={(e) => setProviderId(e.target.value)}
                      className="w-full px-4 py-3 bg-[#071A35] border border-sds-border rounded-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] cursor-pointer"
                    >
                      {PROVIDERS.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#071A35] text-white">
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Corridor country Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                      {t.chooseCountry}
                    </label>
                    <select
                      value={corridorId}
                      onChange={(e) => setCorridorId(e.target.value)}
                      className="w-full px-4 py-3 bg-[#071A35] border border-sds-border rounded-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] cursor-pointer"
                    >
                      {CORRIDORS.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#071A35] text-white">
                          {c.flag} {language === 'en' ? c.toCountry : c.toCountryAr} ({c.currencyCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2.5 bg-[#10B981] hover:bg-[#10B981]/90 text-[#071A35] rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <span>Configure Rates</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TIMELINE STEP 2: RATES & FEES */}
            {activeStep === 2 && (
              <div className="space-y-5 text-left animate-fadeIn">
                <div className="border-b border-sds-border/60 pb-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">
                    Step 2: Enter Today's Rates
                  </h3>
                  <p className="text-xs text-sds-text-sec mt-0.5">Configure transaction parameters currently shown inside your wallet.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Send Amount */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                      {t.sendingAmount}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-4 py-3 bg-[#071A35] border border-sds-border rounded-xl font-bold font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sds-text-sec text-xs font-bold font-mono">
                        SAR
                      </div>
                    </div>
                  </div>

                  {/* Exchange Rate */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                      Rate (1 SAR =)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        placeholder={activeCorridor.baseExchangeRate.toString()}
                        className="w-full px-4 py-3 bg-[#071A35] border border-sds-border rounded-xl font-bold font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sds-text-sec text-xs font-bold font-mono">
                        {activeCorridor.currencyCode}
                      </div>
                    </div>
                  </div>

                  {/* Transfer Fee */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                      {t.transferFee} (SAR)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={transferFee}
                        onChange={(e) => setTransferFee(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-4 py-3 bg-[#071A35] border border-sds-border rounded-xl font-bold font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sds-text-sec text-xs font-bold font-mono">
                        SAR
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* VAT */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                      VAT Amount (SAR)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={vatAmount}
                        onChange={(e) => setVatAmount(e.target.value)}
                        placeholder="Auto (15%)"
                        className="w-full px-4 py-3 bg-[#071A35] border border-sds-border rounded-xl font-bold font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sds-text-sec text-xs font-bold font-mono">
                        SAR
                      </div>
                    </div>
                  </div>

                  {/* Other hidden costs */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                      Other / Hidden Costs (SAR)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={otherCosts}
                        onChange={(e) => setOtherCosts(Math.max(0, parseInt(e.target.value) || 0).toString())}
                        placeholder="0"
                        className="w-full px-4 py-3 bg-[#071A35] border border-sds-border rounded-xl font-bold font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sds-text-sec text-xs font-bold font-mono">
                        SAR
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2.5 bg-[#071A35] border border-sds-border hover:bg-[#091f3e] text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2.5 bg-[#10B981] hover:bg-[#10B981]/90 text-[#071A35] rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <span>Upload Proof</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TIMELINE STEP 3: PROOF SCREENSHOT & SUBMIT */}
            {activeStep === 3 && (
              <div className="space-y-5 text-left animate-fadeIn">
                <div className="border-b border-sds-border/60 pb-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">
                    Step 3: Verification Evidence
                  </h3>
                  <p className="text-xs text-sds-text-sec mt-0.5">Please provide a screenshot of the wallet interface as verification proof.</p>
                </div>

                {/* Drag and Drop */}
                <div className="space-y-2">
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                      dragActive 
                        ? 'border-[#10B981] bg-[#10B981]/5' 
                        : previewUrl 
                        ? 'border-[#10B981]/40 bg-[#071A35]/50' 
                        : 'border-sds-border hover:border-[#10B981] hover:bg-[#071A35]/30'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {previewUrl ? (
                      <div className="space-y-3 w-full max-w-xs relative" onClick={(e) => e.stopPropagation()}>
                        <div className="relative mx-auto w-24 h-24 rounded-lg overflow-hidden border border-sds-border shadow-sm">
                          <img src={previewUrl} alt="Screenshot Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={removeFile}
                            className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-white block truncate">{selectedFile?.name}</span>
                          <span className="text-sds-text-sec font-mono">{(selectedFile!.size / 1024).toFixed(0)} KB</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl text-[#10B981] mb-2">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-white block">
                          {language === 'en' ? 'Click to upload or drag screenshot' : 'اضغط للتحميل أو اسحب لقطة الشاشة'}
                        </span>
                        <span className="text-[10px] text-sds-text-sec block mt-1">
                          PNG, JPG, up to 5MB (Receipts from STC Pay, Urpay, etc.)
                        </span>
                      </>
                    )}

                    {isUploading && (
                      <div className="w-full max-w-xs mt-3 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-sds-text-sec uppercase font-mono">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-1 bg-[#071A35] rounded-full overflow-hidden">
                          <div className="h-full bg-[#10B981] transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recipient breakdown receipt widget */}
                <div className="p-4 bg-[#071A35] rounded-2xl border border-sds-border flex items-center justify-between text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-[#F59E0B] block uppercase tracking-wider font-mono">Calculated Recipient Return</span>
                    <span className="text-[10px] text-sds-text-sec block leading-relaxed max-w-[280px]">
                      Formula: ({sendAmount} SAR - {transferFee} SAR Fee - {vatAmount !== '' ? parseFloat(vatAmount) || 0 : (transferFee * 0.15).toFixed(2)} SAR VAT {parseFloat(otherCosts) > 0 ? `- ${otherCosts} SAR Other` : ''}) * {parsedRate} Rate
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-base sm:text-lg font-black text-[#10B981] block leading-none">
                      {Math.max(0, (sendAmount - transferFee - (vatAmount !== '' ? parseFloat(vatAmount) || 0 : transferFee * 0.15) - (parseFloat(otherCosts) || 0)) * parsedRate).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-[9px] text-sds-text-sec font-bold uppercase font-mono mt-1 block">
                      {activeCorridor.currencyCode}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2.5 bg-[#071A35] border border-sds-border hover:bg-[#091f3e] text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isUploading}
                    className="px-6 py-2.5 bg-[#10B981] hover:bg-[#10B981]/90 text-[#071A35] font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Verification</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* SIDEBAR GUIDELINES & HISTORY - RIGHT (Col span 5) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            
            {/* Guidelines Card */}
            <div className="bg-[#0C2547] border border-sds-border rounded-3xl p-6 space-y-4 shadow-sds-md">
              <div className="p-2 bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] rounded-xl w-fit">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Why share rates with SariRemit?</h3>
              <p className="text-xs text-sds-text-sec leading-relaxed">
                Remittance services fluctuate every hour. By sharing the rate currently showing inside your app, you empower thousands of expats to make smart decisions and save money.
              </p>
              
              <div className="space-y-3 pt-3 text-xs border-t border-sds-border/60">
                <div className="flex items-start gap-2">
                  <span className="text-[#10B981] font-bold font-mono">✓</span>
                  <span className="text-sds-text-sec">Earn Contributor points on your Profile.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#10B981] font-bold font-mono">✓</span>
                  <span className="text-sds-text-sec">Screenshots are auto-redacted for safety. No private data is ever shared.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#10B981] font-bold font-mono">✓</span>
                  <span className="text-sds-text-sec">Rates are immediately verified by community moderators.</span>
                </div>
              </div>
            </div>

            {/* CONTRIBUTION HISTORY TIMELINE */}
            {myRecentSubmissions.length > 0 && (
              <div className="bg-[#0C2547] border border-sds-border rounded-3xl p-6 space-y-4 shadow-sds-md">
                <div className="flex items-center justify-between border-b border-sds-border/60 pb-2.5">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    {language === 'en' ? 'Your Contribution Timeline' : 'مشاركاتك الأخيرة'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setRefreshTrigger(prev => prev + 1)}
                    disabled={isRefreshingHistory}
                    className="p-1 hover:bg-white/10 rounded text-sds-text-sec hover:text-white transition-all flex items-center gap-1 text-[10px] font-black font-mono cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingHistory ? 'animate-spin text-[#10B981]' : ''}`} />
                    <span>Sync</span>
                  </button>
                </div>

                {/* Submissions Vertical Timeline Layout */}
                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                  {myRecentSubmissions.map((sub, idx) => {
                    const corr = CORRIDORS.find(c => c.id === sub.corridorId) || CORRIDORS[0];
                    return (
                      <div key={sub.id} className="relative pl-5 border-l-2 border-sds-border/50 space-y-2 pb-2">
                        {/* Dot indicator */}
                        <div className={`absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full ${
                          sub.status === 'approved' ? 'bg-[#10B981]' : sub.status === 'pending' ? 'bg-[#F59E0B]' : 'bg-rose-500'
                        }`} />

                        <div className="text-xs text-left">
                          <div className="flex justify-between items-center">
                            <span className="font-black text-white uppercase text-[11px] leading-none">
                              {sub.providerName} ({corr.flag})
                            </span>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                              sub.status === 'approved' 
                                ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' 
                                : sub.status === 'pending' 
                                ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20 animate-pulse' 
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {sub.status}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-sds-text-sec mt-1">
                            <span>1 SAR = <span className="text-[#F59E0B] font-bold font-mono">{sub.exchangeRate}</span> {corr.currencyCode}</span>
                            <span className="text-[9px] font-mono">{getRelativeTimeText(sub.submittedAt)}</span>
                          </div>

                          <div className="mt-1.5 p-2 bg-[#071A35] rounded-xl border border-sds-border/60 flex justify-between text-[9px] text-sds-text-sec font-mono">
                            <span>Fee: {sub.transferFee} SAR</span>
                            <span>Other: {sub.otherCosts || 0} SAR</span>
                            <span>Total Payout: {sub.receiveAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {corr.currencyCode}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Disclaimers */}
      <div className={`p-4 bg-[#0C2547]/60 border border-sds-border rounded-2xl flex items-start gap-2.5 ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
        <Info className="w-4 h-4 text-sds-text-sec shrink-0 mt-0.5" />
        <p className="text-[10px] sm:text-xs text-sds-text-sec leading-relaxed font-medium">
          Evidence photos are automatically processed by our SariRemit receipt OCR parser. No personal identity data is captured. Your contribution remains private, secure, and helpful.
        </p>
      </div>

    </div>
  );
}
