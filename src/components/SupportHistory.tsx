import React, { useState, useEffect } from 'react';
import { TranslationDict, SupportFeedbackRequest, SupportRequestMessage } from '../types';
import { fetchUserSupportRequests, fetchSupportMessages, addSupportMessage, getAuthSession } from '../services/supabaseService';
import { PROVIDERS, CORRIDORS } from '../services/constants';
import { SDSButton, SDSCard, SDSBadge, SDSInput } from './Sds';
import { 
  MessageSquare, Clock, ShieldAlert, CheckCircle, AlertTriangle, 
  Send, RefreshCw, ArrowLeft, Building2, HelpCircle, AlertCircle
} from 'lucide-react';

interface SupportHistoryProps {
  language: 'en' | 'ar';
  t: TranslationDict;
  onBack?: () => void;
}

export default function SupportHistory({ language, t, onBack }: SupportHistoryProps) {
  const isRtl = language === 'ar';
  const [requests, setRequests] = useState<SupportFeedbackRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupportFeedbackRequest | null>(null);
  const [messages, setMessages] = useState<SupportRequestMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadRequests = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchUserSupportRequests();
      // Sort by updated_at descending
      const sorted = [...data].sort((a, b) => 
        new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
      );
      setRequests(sorted);
    } catch (err: any) {
      console.error('Error fetching support requests:', err);
      setErrorMsg(language === 'en' ? 'Could not load your support tickets.' : 'تعذر تحميل تذاكر الدعم الخاصة بك.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSelectRequest = async (req: SupportFeedbackRequest) => {
    setSelectedRequest(req);
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const msgs = await fetchSupportMessages(req.id);
      // Sort chronologically
      const sortedMsgs = [...msgs].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(sortedMsgs);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setErrorMsg(language === 'en' ? 'Could not load conversation thread.' : 'تعذر تحميل سلسلة المحادثة.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !newMessageText.trim() || isSending) return;

    setIsSending(true);
    setErrorMsg(null);
    try {
      const session = getAuthSession();
      const senderUserId = session.user?.id || null;

      const msg = await addSupportMessage(
        selectedRequest.id,
        senderUserId,
        'user',
        newMessageText.trim(),
        false
      );

      setMessages(prev => [...prev, msg]);
      setNewMessageText('');
      
      // Update requests list updated_at locally
      setRequests(prev => prev.map(r => {
        if (r.id === selectedRequest.id) {
          return { ...r, updated_at: new Date().toISOString() };
        }
        return r;
      }));
    } catch (err: any) {
      console.error('Error sending support message:', err);
      setErrorMsg(language === 'en' ? 'Failed to dispatch reply.' : 'فشل إرسال الرد.');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 animate-pulse" />
            {language === 'en' ? 'Open' : 'مفتوحة'}
          </span>
        );
      case 'under_review':
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="w-3 h-3 animate-spin-slow" />
            {language === 'en' ? 'Under Review' : 'قيد المراجعة'}
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" />
            {language === 'en' ? 'Resolved' : 'تم حلها'}
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-750 border border-slate-250">
            <AlertCircle className="w-3 h-3" />
            {language === 'en' ? 'Closed' : 'مغلقة'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general_feedback': return language === 'en' ? 'General Feedback' : 'ملاحظات عامة';
      case 'technical_issue': return language === 'en' ? 'Technical Issue' : 'مشكلة تقنية';
      case 'rate_discrepancy': return language === 'en' ? 'Rate Discrepancy' : 'اختلاف سعر الصرف';
      case 'compliance_query': return language === 'en' ? 'Compliance Query' : 'استفسار امتثال';
      default: return category.replace('_', ' ');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 text-slate-200">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          {selectedRequest ? (
            <button 
              onClick={() => setSelectedRequest(null)}
              className="p-2 bg-[#0C2547] hover:bg-[#071A35] border border-slate-700 rounded-xl text-slate-300 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            onBack && (
              <button 
                onClick={onBack}
                className="p-2 bg-[#0C2547] hover:bg-[#071A35] border border-slate-700 rounded-xl text-slate-300 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            )
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              {selectedRequest 
                ? (language === 'en' ? `Ticket: ${selectedRequest.ticket_number}` : `تذكرة: ${selectedRequest.ticket_number}`)
                : (language === 'en' ? 'My Support Requests' : 'طلبات الدعم الخاصة بي')
              }
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {selectedRequest 
                ? (language === 'en' ? 'Review active conversation and updates' : 'راجع المحادثة النشطة والتحديثات')
                : (language === 'en' ? 'Track all registered compliance reports, queries, and feedback' : 'تابع جميع تقارير الامتثال، الاستفسارات، والملاحظات المسجلة')
              }
            </p>
          </div>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <SDSButton 
            onClick={loadRequests} 
            variant="secondary"
            className="flex items-center gap-1.5 bg-sds-card border border-sds-border text-sds-text-sec hover:text-sds-text px-3 py-1.5 text-xs rounded-xl"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {language === 'en' ? 'Refresh' : 'تحديث'}
          </SDSButton>
        </div>
      </div>

      {errorMsg && (
        <div className="text-xs text-rose-400 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 font-bold text-left">
          ⚠️ {errorMsg}
        </div>
      )}

      {selectedRequest ? (
        /* DETAIL VIEW & THREAD */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT PANEL: Ticket details */}
          <div className="lg:col-span-1 space-y-4">
            <SDSCard className="bg-sds-card border-sds-border p-5 space-y-4 rounded-2xl shadow-sds-md">
              <h3 className="text-sm font-extrabold text-sds-text uppercase tracking-wider border-b border-sds-border pb-2">
                {language === 'en' ? 'Ticket Properties' : 'خصائص التذكرة'}
              </h3>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">{language === 'en' ? 'Status:' : 'الحالة:'}</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">{language === 'en' ? 'Category:' : 'الفئة:'}</span>
                  <span className="font-bold text-slate-200">{getCategoryLabel(selectedRequest.category)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">{language === 'en' ? 'Created:' : 'تاريخ الإنشاء:'}</span>
                  <span className="font-mono text-slate-300">
                    {new Date(selectedRequest.created_at).toLocaleString(language === 'en' ? 'en-US' : 'ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">{language === 'en' ? 'Risk Index:' : 'مؤشر المخاطر:'}</span>
                  <span className={`font-mono font-bold ${
                    selectedRequest.saf_risk_score > 60 ? 'text-rose-400' :
                    selectedRequest.saf_risk_score > 30 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {selectedRequest.saf_risk_score} / 100
                  </span>
                </div>

                {selectedRequest.related_channel_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">{language === 'en' ? 'Channel:' : 'القناة:'}</span>
                    <span className="font-bold text-slate-200">
                      {PROVIDERS.find(p => p.id === selectedRequest.related_channel_id)?.name || selectedRequest.related_channel_id}
                    </span>
                  </div>
                )}

                {selectedRequest.related_corridor_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">{language === 'en' ? 'Corridor:' : 'الممر:'}</span>
                    <span className="font-bold text-slate-200">
                      {CORRIDORS.find(c => c.id === selectedRequest.related_corridor_id)?.flag} {selectedRequest.related_corridor_id.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </SDSCard>

            {/* Admin Response Note Panel (If available) */}
            {selectedRequest.resolution_notes && (
              <SDSCard className="bg-emerald-950/25 border-emerald-500/20 p-5 space-y-2 rounded-2xl">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {language === 'en' ? 'Official Resolution Note' : 'ملاحظة الحل الرسمية'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{selectedRequest.resolution_notes}"
                </p>
              </SDSCard>
            )}
          </div>

          {/* RIGHT PANEL: Message Thread */}
          <div className="lg:col-span-2 space-y-4">
            <SDSCard className="bg-[#0C2547]/30 border-slate-750/50 rounded-2xl flex flex-col h-[550px] overflow-hidden shadow-xl">
              {/* Thread header */}
              <div className="bg-[#0C2547]/70 p-4 border-b border-slate-800/80">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  {selectedRequest.subject}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {selectedRequest.message}
                </p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin bg-[#04111F]/40">
                {/* Initial Support Request Entry */}
                <div className="flex flex-col items-start max-w-[85%]">
                  <div className="bg-[#0C2547] border border-slate-750 text-slate-200 rounded-2xl px-4 py-3 text-xs leading-relaxed">
                    <p className="font-extrabold text-[10px] text-amber-400 uppercase tracking-widest mb-1.5">
                      {selectedRequest.name} ({language === 'en' ? 'Original Submission' : 'الطلب الأصلي'})
                    </p>
                    <p>{selectedRequest.message}</p>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
                    {new Date(selectedRequest.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Follow ups */}
                {messages.map((msg) => {
                  const isUser = msg.sender_role === 'user';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed border ${
                        isUser 
                          ? 'bg-[#0E2F5B]/80 border-[#1C4E8A] text-slate-100' 
                          : 'bg-slate-900/90 border-slate-750 text-amber-100'
                      }`}>
                        <p className={`font-extrabold text-[9px] uppercase tracking-widest mb-1 ${
                          isUser ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {msg.sender_name} ({isUser ? (language === 'en' ? 'You' : 'أنت') : (language === 'en' ? 'Support Desk' : 'مكتب الدعم')})
                        </p>
                        <p>{msg.message}</p>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              {selectedRequest.status === 'closed' || selectedRequest.status === 'resolved' ? (
                <div className="bg-[#071A35]/90 p-4 border-t border-slate-800/80 text-center text-xs text-slate-400 font-mono font-bold">
                  🔏 {language === 'en' ? 'This support ticket is marked resolved/closed.' : 'هذه التذكرة مغلقة أو تم حلها.'}
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="bg-[#0C2547]/60 p-3 border-t border-slate-800/80 flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder={language === 'en' ? 'Type your reply message...' : 'اكتب ردك هنا...'}
                    className="flex-1 bg-[#04111F] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-slate-500"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    disabled={isSending}
                    required
                  />
                  <SDSButton 
                    type="submit" 
                    disabled={isSending || !newMessageText.trim()}
                    variant="primary"
                    className="bg-sds-gold hover:bg-sds-gold/90 text-slate-950 rounded-xl p-2.5 flex items-center justify-center transition disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </SDSButton>
                </form>
              )}
            </SDSCard>
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-16 bg-sds-card border border-sds-border rounded-2xl space-y-4">
              <div className="w-12 h-12 bg-sds-bg-sec text-sds-text-sec rounded-full flex items-center justify-center mx-auto border border-sds-border">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-sds-text">
                  {language === 'en' ? 'No Support Requests Found' : 'لا توجد طلبات دعم حالياً'}
                </h3>
                <p className="text-xs text-sds-text-sec max-w-sm mx-auto">
                  {language === 'en' 
                    ? 'Any compliance queries, rate discrepancies, or general feedback tickets you submit will appear here.'
                    : 'أي استفسارات امتثال أو تذاكر اختلاف أسعار الصرف أو ملاحظات ترسلها ستظهر هنا.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((req) => (
                <div 
                  key={req.id}
                  onClick={() => handleSelectRequest(req)}
                  className="bg-sds-card hover:bg-sds-bg-sec border border-sds-border rounded-2xl p-5 cursor-pointer transition-all duration-300 space-y-3.5 flex flex-col justify-between shadow-sds-sm"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-mono font-bold text-sds-gold">
                        {req.ticket_number}
                      </span>
                      {getStatusBadge(req.status)}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-sds-text line-clamp-1">
                        {req.subject}
                      </h4>
                      <p className="text-xs text-sds-text-sec line-clamp-2 mt-1">
                        {req.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-sds-text-sec font-mono border-t border-sds-border pt-3">
                    <span>
                      {getCategoryLabel(req.category)}
                    </span>
                    <span>
                      {new Date(req.updated_at || req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
