import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Check, 
  Coins, 
  TrendingUp, 
  Info, 
  Lock, 
  Smartphone, 
  ArrowRight,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import { Corridor, RecordedTransfer } from '../types';
import { saveRecordedTransfer, ACHIEVEMENT_DEFINITIONS } from '../services/supabaseService';
import { createNotification } from '../services/notificationService';

interface RecordTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  option: any; // Selected option from CompareRates
  sendAmount: number; // Default SAR send amount
  corridor: Corridor; // Current corridor (e.g. sa-pk)
  otherOptions: any[]; // All other provider options for calculations
  userId: string;
  comparisonTargetId?: string | null; // Matchup provider ID if active
  onSuccess: (newAchievements: any[], isFirstTime: boolean) => void;
  isRtl?: boolean;
}

export const RecordTransferModal: React.FC<RecordTransferModalProps> = ({
  isOpen,
  onClose,
  option,
  sendAmount: initialSendAmount,
  corridor,
  otherOptions,
  userId,
  comparisonTargetId,
  onSuccess,
  isRtl = false
}) => {
  const [sendAmountSAR, setSendAmountSAR] = useState<number>(initialSendAmount);
  const [actualRecipientAmount, setActualRecipientAmount] = useState<string>('');
  const [comparisonType, setComparisonType] = useState<'best_vs_average' | 'best_vs_worst' | 'direct_matchup'>('best_vs_average');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen && option) {
      setSendAmountSAR(initialSendAmount);
      setActualRecipientAmount('');
      if (comparisonTargetId) {
        setComparisonType('direct_matchup');
        setSelectedTargetId(comparisonTargetId);
      } else {
        setComparisonType('best_vs_average');
        const firstOther = otherOptions.find(o => o.resolved.provider_id !== option.resolved.provider_id);
        setSelectedTargetId(firstOther?.resolved.provider_id || '');
      }
    }
  }, [isOpen, option, initialSendAmount, comparisonTargetId, otherOptions]);

  if (!isOpen || !option) return null;

  const provider = option.resolved;
  const resolvedRate = provider.resolved_rate;
  const feeSAR = provider.transfer_fee || 0;
  const vatSAR = provider.vat_amount || 0;
  const otherChargesSAR = provider.other_costs || 0;

  // 1. Calculate chosen option's net receipt at current sendAmountSAR
  const netAmountChosen = (sendAmountSAR - feeSAR) * resolvedRate;

  // 2. Helper to calculate net amount for any other provider in list at current sendAmount
  const calculateOtherNet = (otherOpt: any, amount: number) => {
    const oRate = otherOpt.resolved.resolved_rate;
    const oFee = otherOpt.resolved.transfer_fee || 0;
    return Math.max(0, (amount - oFee) * oRate);
  };

  // 3. Dynamic comparison metrics based on selected type
  let comparisonProviderName = '';
  let comparisonNet = 0;

  const validOthers = otherOptions.filter(o => o.resolved.provider_id !== provider.provider_id);

  if (comparisonType === 'direct_matchup' && selectedTargetId) {
    const targetOpt = otherOptions.find(o => o.resolved.provider_id === selectedTargetId);
    if (targetOpt) {
      comparisonProviderName = targetOpt.resolved.provider_name;
      comparisonNet = calculateOtherNet(targetOpt, sendAmountSAR);
    }
  } else if (comparisonType === 'best_vs_worst' && validOthers.length > 0) {
    // Find worst option (lowest net recipient amount)
    let worstOpt = validOthers[0];
    let worstNet = calculateOtherNet(worstOpt, sendAmountSAR);
    for (let i = 1; i < validOthers.length; i++) {
      const net = calculateOtherNet(validOthers[i], sendAmountSAR);
      if (net < worstNet) {
        worstNet = net;
        worstOpt = validOthers[i];
      }
    }
    comparisonProviderName = worstOpt.resolved.provider_name;
    comparisonNet = worstNet;
  } else {
    // best_vs_average
    comparisonProviderName = isRtl ? 'متوسط السوق' : 'Market Average';
    if (validOthers.length > 0) {
      const sumNet = validOthers.reduce((acc, curr) => acc + calculateOtherNet(curr, sendAmountSAR), 0);
      comparisonNet = sumNet / validOthers.length;
    } else {
      comparisonNet = netAmountChosen * 0.95; // default 5% lower average fallback if no competitors
    }
  }

  // Savings in Destination Currency
  const estimatedSavingsDestination = Math.max(0, netAmountChosen - comparisonNet);
  // Savings in SAR
  const estimatedSavingsSAR = estimatedSavingsDestination / resolvedRate;

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setErrorMessage(isRtl ? 'يجب تسجيل الدخول لتسجيل هذه المعاملة.' : 'You must be signed in to record a transfer.');
      return;
    }

    if (sendAmountSAR <= 0) {
      setErrorMessage(isRtl ? 'يرجى إدخال مبلغ إرسال صحيح.' : 'Please enter a valid send amount.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const actualVal = actualRecipientAmount ? parseFloat(actualRecipientAmount) : undefined;

      const record: RecordedTransfer = {
        id: `rec-trans-${Date.now()}`,
        userId,
        channelId: provider.provider_id,
        corridorId: corridor.id,
        sendAmountSAR,
        destinationCurrency: corridor.currencyCode,
        estimatedRecipientAmount: netAmountChosen,
        actualRecipientAmount: actualVal || null,
        resolvedRate,
        rateSource: provider.source_type,
        transferFeeSAR: feeSAR,
        vatAmountSAR: vatSAR,
        otherChargesSAR: otherChargesSAR,
        estimatedSavingsDestination: estimatedSavingsDestination > 0 ? estimatedSavingsDestination : null,
        estimatedSavingsSAR: estimatedSavingsSAR > 0 ? estimatedSavingsSAR : null,
        savingsComparisonType: comparisonType,
        comparisonChannelId: comparisonType === 'direct_matchup' ? selectedTargetId : null,
        idempotencyKey: `idemp-${provider.provider_id}-${corridor.id}-${sendAmountSAR}-${Date.now().toString().slice(-6)}`,
        recordedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const result = await saveRecordedTransfer(record);
      if (result.success) {
        // Trigger transfer notification in SNS
        try {
          await createNotification({
            userId,
            audienceType: 'user',
            category: 'transfer',
            priority: 'normal',
            title: isRtl ? 'تم تسجيل الحوالة بنجاح' : 'Transfer Recorded Successfully',
            message: isRtl 
              ? `لقد سجلت تحويلاً بقيمة ${sendAmountSAR} ر.س إلى ${corridor.toCountry}. التوفير المقدر: ${estimatedSavingsSAR > 0 ? estimatedSavingsSAR.toFixed(2) : '0'} ر.س.`
              : `You recorded a transfer of ${sendAmountSAR} SAR to ${corridor.toCountry}. Estimated savings: ${estimatedSavingsSAR > 0 ? estimatedSavingsSAR.toFixed(2) : '0'} SAR.`,
            actionLabel: isRtl ? 'عرض المدخرات' : 'View Savings',
            actionUrl: '/savings',
            payload: { sendAmountSAR, targetCountry: corridor.toCountry, savingsSAR: estimatedSavingsSAR },
            sourceSystem: 'SEPS',
            sourceEvent: 'transfer_recorded',
            sourceId: record.id
          });

          // Trigger achievement notification if first time
          if (result.firstTime) {
            await createNotification({
              userId,
              audienceType: 'user',
              category: 'achievement',
              priority: 'high',
              title: isRtl ? 'إنجاز جديد: خطوتك الأولى!' : 'New Achievement: Your First Step!',
              message: isRtl
                ? 'تهانينا على تسجيل معاملتك الأولى مع SariRemit! تم تفعيل مكافأة مدخراتك الأولى.'
                : 'Congratulations on recording your first transaction with SariRemit! Your first savings reward is active.',
              actionLabel: isRtl ? 'عرض الإنجازات' : 'View Achievements',
              actionUrl: '/profile',
              payload: { achievementCode: 'first_transfer' },
              sourceSystem: 'SAF',
              sourceEvent: 'achievement_unlocked',
              sourceId: `ach_first_transfer_${userId}`
            });
          }

          if (result.newAchievements && result.newAchievements.length > 0) {
            for (const ach of result.newAchievements) {
              const def = ACHIEVEMENT_DEFINITIONS.find(d => d.id === ach.achievementId);
              const title = def?.title || 'New Achievement';
              const desc = def?.description || 'You unlocked a new milestone!';
              await createNotification({
                userId,
                audienceType: 'user',
                category: 'achievement',
                priority: 'normal',
                title: isRtl ? `تم فتح الإنجاز: ${title}` : `Achievement Unlocked: ${title}`,
                message: desc,
                actionLabel: isRtl ? 'عرض الملف' : 'View Profile',
                actionUrl: '/profile',
                payload: { achievementId: ach.achievementId },
                sourceSystem: 'SAF',
                sourceEvent: 'achievement_unlocked',
                sourceId: `ach_${ach.achievementId}_${userId}`
              });
            }
          }
        } catch (notifErr) {
          console.warn('[SNS] Failed to trigger transfer notifications:', notifErr);
        }

        onSuccess(result.newAchievements, result.firstTime);
        onClose();
      } else {
        setErrorMessage(isRtl ? 'فشل حفظ المعاملة. يرجى المحاولة لاحقاً.' : 'Failed to save transaction. Please try again.');
      }
    } catch (err: any) {
      console.error('[RecordTransferModal] Error recording transfer:', err);
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#030914]/80 backdrop-blur-sm"
          id="modal-backdrop"
        />

        {/* Modal body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-[#0C2547] border border-sds-border rounded-3xl shadow-2xl overflow-hidden z-10"
          id="record-transfer-modal"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-[#071A35] border-b border-sds-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#F59E0B]" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {isRtl ? 'تسجيل معاملة تحويل مالي' : 'RECORD MONEY TRANSFER'}
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-[#112F58] rounded-xl text-sds-text-sec hover:text-white transition-colors cursor-pointer"
              id="close-modal-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleRecord} className="p-6 space-y-5">
            {/* Context Notice */}
            <div className="p-3.5 bg-[#071A35] border border-sds-border/60 rounded-2xl flex items-start gap-3 text-left">
              <Info className="w-4 h-4 text-sds-text-sec shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-[10px] text-sds-text-sec uppercase font-bold tracking-wider leading-none">
                  {isRtl ? 'تكامل محرك حماية الثقة والتوفير' : 'INTEGRITY & SAVINGS VERIFICATION'}
                </p>
                <p className="text-xs text-slate-200 leading-normal mt-1">
                  {isRtl 
                    ? `جاري تسجيل التحويل عبر ماليّة ${provider.provider_name}. سيتم توثيق مدخراتك الذكية تلقائيًا في سجلك.` 
                    : `Recording transaction via ${provider.provider_name}. Your smart savings metrics will be automatically integrated into your profile.`}
                </p>
              </div>
            </div>

            {/* Inputs Section */}
            <div className="space-y-4 text-left">
              {/* Send Amount Input */}
              <div>
                <label className="text-[10px] font-black text-sds-text-sec uppercase tracking-widest block mb-1.5">
                  {isRtl ? 'مبلغ الإرسال الفعلي (SAR)' : 'ACTUAL SEND AMOUNT (SAR)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={sendAmountSAR || ''}
                    onChange={(e) => setSendAmountSAR(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-[#071A35] border border-sds-border focus:border-[#10B981] rounded-2xl px-4 py-3 text-white font-mono text-base font-bold outline-none transition-colors"
                    placeholder="1,000"
                    required
                    id="send-amount-input"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-sds-text-sec">
                    SAR
                  </span>
                </div>
              </div>

              {/* Recipient estimate & actual overlay */}
              <div className="grid grid-cols-2 gap-4">
                {/* Expected Receipt */}
                <div className="p-3 bg-[#071A35]/50 border border-sds-border/40 rounded-2xl">
                  <span className="text-[9px] font-black text-sds-text-sec uppercase tracking-wider block">
                    {isRtl ? 'المستلم المتوقع' : 'EXPECTED RECEIPT'}
                  </span>
                  <div className="mt-1 font-mono text-white text-sm font-black">
                    {netAmountChosen.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    <span className="text-xs font-bold text-[#10B981] ml-1">{corridor.currencyCode}</span>
                  </div>
                </div>

                {/* Actual Received (Optional) */}
                <div>
                  <label className="text-[9px] font-black text-sds-text-sec uppercase tracking-wider block mb-1">
                    {isRtl ? 'المستلم الفعلي (اختياري)' : 'ACTUAL RECEIVED (OPTIONAL)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={actualRecipientAmount}
                      onChange={(e) => setActualRecipientAmount(e.target.value)}
                      className="w-full bg-[#071A35] border border-sds-border/80 focus:border-[#10B981] rounded-2xl px-3 py-2 text-white font-mono text-sm outline-none transition-colors"
                      placeholder={netAmountChosen.toFixed(0)}
                      id="actual-recipient-input"
                    />
                  </div>
                </div>
              </div>

              {/* Comparison Mode Selection */}
              <div>
                <label className="text-[10px] font-black text-sds-text-sec uppercase tracking-widest block mb-1.5">
                  {isRtl ? 'أساس مقارنة المدخرات' : 'SAVINGS COMPARISON BENCHMARK'}
                </label>
                <div className="grid grid-cols-3 gap-2 bg-[#071A35] p-1 border border-sds-border rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setComparisonType('best_vs_average')}
                    className={`py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${comparisonType === 'best_vs_average' ? 'bg-[#10B981] text-[#071A35]' : 'text-sds-text-sec hover:text-white'}`}
                  >
                    {isRtl ? 'متوسط السوق' : 'Market Avg'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonType('best_vs_worst')}
                    className={`py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${comparisonType === 'best_vs_worst' ? 'bg-[#10B981] text-[#071A35]' : 'text-sds-text-sec hover:text-white'}`}
                  >
                    {isRtl ? 'أسوأ بديل' : 'Worst Price'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setComparisonType('direct_matchup');
                      if (!selectedTargetId && validOthers.length > 0) {
                        setSelectedTargetId(validOthers[0].resolved.provider_id);
                      }
                    }}
                    disabled={validOthers.length === 0}
                    className={`py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer disabled:opacity-40 ${comparisonType === 'direct_matchup' ? 'bg-[#10B981] text-[#071A35]' : 'text-sds-text-sec hover:text-white'}`}
                  >
                    {isRtl ? 'مقارنة مباشرة' : 'Matchup Target'}
                  </button>
                </div>

                {/* Direct matchup specific selection dropdown */}
                {comparisonType === 'direct_matchup' && validOthers.length > 0 && (
                  <div className="mt-2.5 animate-fadeIn">
                    <select
                      value={selectedTargetId}
                      onChange={(e) => setSelectedTargetId(e.target.value)}
                      className="w-full bg-[#071A35] border border-sds-border rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                      id="matchup-target-select"
                    >
                      {validOthers.map(o => (
                        <option key={o.resolved.provider_id} value={o.resolved.provider_id}>
                          {isRtl ? `مقارنة بـ ${o.resolved.provider_name}` : `Compare with ${o.resolved.provider_name}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Live Computed Savings Widget */}
            <div className="p-4 bg-[#10B981]/5 border border-[#10B981]/20 rounded-2xl text-left">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
                <h4 className="text-[10px] font-black text-[#10B981] uppercase tracking-wider">
                  {isRtl ? 'المدخرات التقديرية الذكية' : 'ESTIMATED SMART SAVINGS'}
                </h4>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-300 font-semibold">
                  {isRtl 
                    ? `مقارنة بـ ${comparisonProviderName}` 
                    : `Compared to ${comparisonProviderName}`}
                </span>
                <div className="font-mono text-right">
                  <div className="text-base font-black text-[#10B981]">
                    +{estimatedSavingsDestination.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    <span className="text-xs font-bold text-white ml-1">{corridor.currencyCode}</span>
                  </div>
                  <div className="text-[10px] text-sds-text-sec font-bold">
                    ≈ {estimatedSavingsSAR.toLocaleString(undefined, { maximumFractionDigits: 1 })} SAR
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-left text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Actions */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#10B981] hover:bg-[#0ea271] disabled:bg-[#10B981]/50 text-[#071A35] font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                id="confirm-record-btn"
              >
                {isSubmitting ? (
                  <span className="animate-spin w-4 h-4 border-2 border-[#071A35] border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isRtl ? 'تأكيد وحفظ التحويل المالي' : 'CONFIRM & RECORD TRANSFER'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
