import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Mail, MessageSquare, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { submitReportedIssue, ReportedIssue, submitUserIssueReport, UserIssueReport } from '../lib/firebase';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession?: any;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ isOpen, onClose, userSession }) => {
  const { language } = useLanguage();
  const [category, setCategory] = useState<string>('disclaimer');
  const [description, setDescription] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showDraftIndicator, setShowDraftIndicator] = useState<boolean>(false);

  // Load saved draft when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedDraft = localStorage.getItem('sariremit_reported_issue_draft');
      if (savedDraft) {
        try {
          const { category: savedCategory, description: savedDescription, email: savedEmail } = JSON.parse(savedDraft);
          if (savedCategory) setCategory(savedCategory);
          if (savedDescription) setDescription(savedDescription);
          if (savedEmail) setEmail(savedEmail);
          setShowDraftIndicator(true);
          
          // Hide restored notice after 4 seconds
          const timer = setTimeout(() => {
            setShowDraftIndicator(false);
          }, 4000);
          return () => clearTimeout(timer);
        } catch (err) {
          console.error('Error loading report issue draft:', err);
        }
      } else if (userSession?.email) {
        setEmail(userSession.email);
      }
    }
  }, [isOpen, userSession]);

  // Save draft on state changes
  useEffect(() => {
    if (!isOpen) return;

    if (description.trim() || email.trim() || category !== 'disclaimer') {
      localStorage.setItem('sariremit_reported_issue_draft', JSON.stringify({
        category,
        description,
        email
      }));
    } else {
      localStorage.removeItem('sariremit_reported_issue_draft');
    }
  }, [category, description, email, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError(language === 'en' ? 'Please provide details about the issue.' : 'الرجاء إدخال تفاصيل المشكلة.');
      return;
    }

    setIsLoading(true);
    setError('');

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newIssue: ReportedIssue = {
      id: reportId,
      category,
      description,
      email: email.trim() || undefined,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    let sessionId = sessionStorage.getItem('sariremit_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('sariremit_session_id', sessionId);
    }

    const newUserIssue: UserIssueReport = {
      id: reportId,
      user_id: userSession?.uid || userSession?.id || null,
      session_id: sessionId,
      page: window.location.pathname || 'home',
      issue_type: category,
      issue_title: category === 'disclaimer' ? 'Incorrect Disclaimer' : category === 'link' ? 'Broken Link' : category === 'rate' ? 'Rate/Fee Discrepancy' : 'Other Issue',
      issue_description: description,
      screenshot_url: '',
      provider: '',
      corridor: '',
      status: 'new',
      priority: 'medium',
      created_at: new Date().toISOString()
    };

    // Submit to both legacy and the new user_issue_reports collection
    const isSuccess = await submitReportedIssue(newIssue);
    await submitUserIssueReport(newUserIssue);
    setIsLoading(false);

    if (isSuccess) {
      setSuccess(true);
      localStorage.removeItem('sariremit_reported_issue_draft');
      setTimeout(() => {
        setSuccess(false);
        setDescription('');
        setEmail('');
        setCategory('disclaimer');
        onClose();
      }, 2500);
    } else {
      setError(language === 'en' ? 'Failed to submit issue. Please try again.' : 'فشل تقديم البلاغ. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in"
      id="report-issue-overlay"
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-lg w-full rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        id="report-issue-dialog"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                {language === 'en' ? 'Report Information Issue' : 'الإبلاغ عن خطأ في المعلومات'}
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                {language === 'en' ? 'Help us maintain absolute accuracy' : 'ساعدنا في الحفاظ على دقة البيانات'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
            id="report-issue-close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {success ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
              <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                {language === 'en' ? 'Report Received Successfully!' : 'تم استلام بلاغك بنجاح!'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                {language === 'en' 
                  ? 'Thank you for your feedback. Our operations team will review the disclaimer, rate, or links and update the listings immediately.' 
                  : 'نشكرك على مساعدتك. سيقوم فريق العمليات لدينا بمراجعة إخلاء المسؤولية أو الأسعار أو الروابط وتحديث القوائم على الفور.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 font-sans">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-600 dark:text-rose-450 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              {showDraftIndicator && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-600 dark:text-emerald-450 flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-bold">
                      {language === 'en' ? 'In-progress draft restored!' : 'تم استعادة مسودة البلاغ السابقة!'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDraftIndicator(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold uppercase tracking-wider underline cursor-pointer"
                  >
                    {language === 'en' ? 'Dismiss' : 'تجاهل'}
                  </button>
                </div>
              )}

              {/* Disclaimer notice */}
              <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                {language === 'en' 
                  ? 'Spotted outdated transfer links, an incorrect compliance disclaimer, or a mismatch in active exchange rates? Let our operations desk know directly below.' 
                  : 'هل لاحظت روابط تحويل غير صالحة، أو إخلاء مسؤولية غير دقيق، أو اختلاف في أسعار الصرف الحية؟ أبلغ فريق العمليات مباشرة أدناه.'}
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  {language === 'en' ? 'Issue Category' : 'فئة المشكلة'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-100 px-3.5 py-2.5 rounded-xl text-xs focus:ring-1 focus:ring-green-500 focus:outline-hidden font-medium"
                >
                  <option value="disclaimer">{language === 'en' ? 'Incorrect Disclaimer / Legal Text' : 'إخلاء مسؤولية أو نصوص تنظيمية غير صحيحة'}</option>
                  <option value="link">{language === 'en' ? 'Broken or Outdated App Link' : 'رابط تطبيق تالف أو قديم'}</option>
                  <option value="rate">{language === 'en' ? 'Exchange Rate / Fee Discrepancy' : 'اختلاف في سعر الصرف أو الرسوم'}</option>
                  <option value="other">{language === 'en' ? 'Other Issue' : 'مشكلة أخرى'}</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  {language === 'en' ? 'Issue Details & Correction' : 'تفاصيل البلاغ والتصحيح المقترح'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === 'en' ? 'Describe what is incorrect and what the correct information should be...' : 'صف ما هو غير صحيح وما ينبغي أن تكون عليه المعلومات الصحيحة...'}
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-100 px-3.5 py-2.5 rounded-xl text-xs focus:ring-1 focus:ring-green-500 focus:outline-hidden font-medium resize-none leading-relaxed"
                />
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  {language === 'en' ? 'Your Email (Optional)' : 'بريدك الإلكتروني (اختياري)'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={language === 'en' ? 'name@example.com' : 'name@example.com'}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-100 pl-10 pr-3.5 py-2.5 rounded-xl text-xs focus:ring-1 focus:ring-green-500 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Draft Status Indicator */}
              {(description.trim() || email.trim() || category !== 'disclaimer') && (
                <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/10 dark:border-emerald-500/10 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-fade-in">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>
                      {language === 'en' ? 'Draft auto-saved locally' : 'تم حفظ مسودة البلاغ تلقائياً محلياً'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDescription('');
                      setEmail('');
                      setCategory('disclaimer');
                      localStorage.removeItem('sariremit_reported_issue_draft');
                    }}
                    className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-bold uppercase text-[9px] tracking-wider underline cursor-pointer"
                  >
                    {language === 'en' ? 'Clear Draft' : 'مسح المسودة'}
                  </button>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'إلغاء'}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-750 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{language === 'en' ? 'Submit Report' : 'إرسال البلاغ'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
