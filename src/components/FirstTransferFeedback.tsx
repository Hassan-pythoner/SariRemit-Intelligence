import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageSquare, Check, X, AlertCircle } from 'lucide-react';
import { UserExperienceFeedback } from '../types';
import { submitUserExperienceFeedback } from '../services/supabaseService';

interface FirstTransferFeedbackProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  relatedTransferId?: string;
  onCompleted: () => void;
  isRtl?: boolean;
}

export const FirstTransferFeedback: React.FC<FirstTransferFeedbackProps> = ({
  isOpen,
  onClose,
  userId,
  relatedTransferId,
  onCompleted,
  isRtl = false
}) => {
  const [rating, setRating] = useState<number>(5);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const emojiOptions = [
    { value: 1, emoji: '😠', label: isRtl ? 'سيء جداً' : 'Poor' },
    { value: 2, emoji: '😟', label: isRtl ? 'سيء' : 'Unsatisfactory' },
    { value: 3, emoji: '😐', label: isRtl ? 'مقبول' : 'Neutral' },
    { value: 4, emoji: '🙂', label: isRtl ? 'جيد' : 'Good' },
    { value: 5, emoji: '🤩', label: isRtl ? 'ممتاز' : 'Excellent' }
  ];

  const feedbackReasons = [
    { id: 'rate_accuracy', label: isRtl ? 'دقة الأسعار المعروضة' : 'Rate Accuracy' },
    { id: 'comparison_clarity', label: isRtl ? 'وضوح المقارنة' : 'Comparison Clarity' },
    { id: 'ui_premium_look', label: isRtl ? 'سهولة ومظهر الواجهة' : 'UI Premium Look' },
    { id: 'smart_recommendations', label: isRtl ? 'جدوى التوصيات الذكية' : 'Smart Recommendations' },
    { id: 'trust_indicators', label: isRtl ? 'مؤشرات الثقة (SIS/TrueCost)' : 'Trust Indicators' }
  ];

  const toggleReason = (id: string) => {
    if (selectedReasons.includes(id)) {
      setSelectedReasons(selectedReasons.filter(r => r !== id));
    } else {
      setSelectedReasons([...selectedReasons, id]);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const feedbackObj: UserExperienceFeedback = {
        id: `feedback-exp-${Date.now()}`,
        userId,
        feedbackType: 'first_transfer_experience',
        rating,
        selectedReasons,
        comment,
        relatedTransferId,
        skipped: false,
        sourceScreen: 'compare_rates_modal',
        submittedAt: new Date().toISOString()
      };

      await submitUserExperienceFeedback(feedbackObj);
      onCompleted();
      onClose();
    } catch (err: any) {
      console.error('[Feedback] Submit failed:', err);
      setErrorMessage(isRtl ? 'فشل إرسال الاستبيان. يرجى المحاولة لاحقاً.' : 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      const feedbackObj: UserExperienceFeedback = {
        id: `feedback-exp-skip-${Date.now()}`,
        userId,
        feedbackType: 'first_transfer_experience',
        rating: null,
        selectedReasons: [],
        comment: null,
        relatedTransferId,
        skipped: true,
        sourceScreen: 'compare_rates_modal',
        submittedAt: new Date().toISOString()
      };
      await submitUserExperienceFeedback(feedbackObj);
      onCompleted();
      onClose();
    } catch (err) {
      onClose();
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
          className="absolute inset-0 bg-[#030914]/85 backdrop-blur-sm"
          onClick={handleSkip}
        />

        {/* Modal container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#0C2547] border border-sds-border rounded-3xl shadow-2xl p-6 z-10 text-center space-y-5"
          id="first-record-experience-prompt"
        >
          {/* Decorative Sparkles Header */}
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[#10B981]" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {isRtl ? 'استبيان المعاملة الأولى الموثوقة' : 'FIRST-TRANSFER FEEDBACK'}
            </h3>
            <p className="text-xs text-sds-text-sec max-w-xs mx-auto leading-normal">
              {isRtl 
                ? 'مبارك إتمام أول معاملة لك! ساعدنا لنطور تجربتك وتجربة سائر الوافدين بملاحظاتك.' 
                : 'Congrats on your first recorded remittance! Share your anonymous experience rating to help improve comparisons.'}
            </p>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-left">
            {/* Rating Emojis Row */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-sds-text-sec uppercase tracking-widest block text-center">
                {isRtl ? 'كيف تقيّم تجربتك على ساري؟' : 'HOW WAS YOUR EXPERIENCE TODAY?'}
              </label>
              <div className="flex justify-around items-center py-2 bg-[#071A35] rounded-2xl border border-sds-border/60">
                {emojiOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRating(opt.value)}
                    className="flex flex-col items-center gap-1 p-1 hover:scale-110 transition-transform cursor-pointer"
                    id={`rating-emoji-${opt.value}`}
                  >
                    <span className={`text-2xl filter drop-shadow-md transition-opacity ${rating === opt.value ? 'opacity-100 scale-125' : 'opacity-40'}`}>
                      {opt.emoji}
                    </span>
                    <span className={`text-[8px] font-bold ${rating === opt.value ? 'text-[#10B981]' : 'text-sds-text-sec'}`}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Structured reason tags */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-sds-text-sec uppercase tracking-widest block">
                {isRtl ? 'ما الذي نال إعجابك أكثر؟' : 'WHAT WENT WELL? (SELECT ALL)'}
              </label>
              <div className="flex flex-wrap gap-2">
                {feedbackReasons.map(r => {
                  const isSelected = selectedReasons.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleReason(r.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${isSelected ? 'bg-[#10B981]/20 border-[#10B981] text-white' : 'bg-[#071A35] border-sds-border text-sds-text-sec hover:text-white'}`}
                      id={`reason-tag-${r.id}`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Section */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-sds-text-sec uppercase tracking-widest block">
                {isRtl ? 'ملاحظات إضافية (اختياري)' : 'ADDITIONAL COMMENTS (OPTIONAL)'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full bg-[#071A35] border border-sds-border focus:border-[#10B981] rounded-2xl p-3 text-xs text-white outline-none resize-none transition-colors"
                placeholder={isRtl ? 'مثال: أسعار ممتازة مقارنة بالمنصات الأخرى...' : 'e.g. Rate was super close to the app, helpful confidence metrics...'}
                id="feedback-comment-textarea"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Buttons Row */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-transparent hover:bg-[#071A35] border border-sds-border/60 text-sds-text-sec hover:text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                id="skip-feedback-btn"
              >
                {isRtl ? 'تخطي الاستبيان' : 'Skip'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-[#10B981] hover:bg-[#0ea271] disabled:bg-[#10B981]/50 text-[#071A35] font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                id="submit-feedback-btn"
              >
                {isSubmitting ? (
                  <span className="animate-spin w-3 h-3 border-2 border-[#071A35] border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'إرسال التقييم' : 'Submit Feedback'}</span>
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
