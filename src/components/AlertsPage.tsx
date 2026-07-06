import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { CORRIDORS, PROVIDERS } from '../data/mockData';
import { RateAlert, CorridorId, ProviderId } from '../types';
import { 
  Bell, BellOff, PlusCircle, CheckCircle, Mail, Phone, AlertTriangle, Trash2, 
  ToggleLeft, ToggleRight, Sparkles, MessageSquare, Info,
  KeyRound, ShieldCheck, ArrowRight, ArrowLeft, Lock
} from 'lucide-react';

interface AlertsPageProps {
  alerts: RateAlert[];
  addNewAlert: (alert: Omit<RateAlert, 'id' | 'createdAt' | 'isActive'>) => void;
  toggleAlertStatus: (id: string) => void;
  deleteAlert: (id: string) => void;
  userSession?: { name: string; email: string; homeCountry: CorridorId } | null;
  onOpenAuthModal?: () => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  addNewAlert,
  toggleAlertStatus,
  deleteAlert,
  userSession,
  onOpenAuthModal,
}) => {
  const { t, language, isRtl } = useLanguage();

  if (!userSession) {
    return (
      <div className="space-y-8 pb-16 text-white animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-8 h-8 text-[#00E07A]" />
            <span>{t('alertsTitle')}</span>
          </h1>
          <p className="text-[#AFC4D8] text-sm max-w-2xl">
            {t('alertsSub')}
          </p>
        </div>

        {/* Lock Wall */}
        <div className="max-w-2xl mx-auto bg-[#061B3A] border border-white/10 p-8 rounded-[28px] shadow-2xl text-center space-y-6 mt-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-[#00E07A]/10 border border-[#00E07A]/25 flex items-center justify-center text-[#00E07A] relative">
              <KeyRound className="w-10 h-10" />
              <Lock className="w-5 h-5 absolute -bottom-1 -right-1 bg-[#031126] text-[#00E07A] rounded-full p-0.5 border-2 border-white/10" />
            </div>
          </div>

          <div className="space-y-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#00E07A]/10 border border-[#00E07A]/25 text-[10px] font-bold text-[#00E07A] rounded-full font-mono uppercase tracking-wider">
              {language === 'en' ? 'SMART RATE ALERTS' : 'تنبيهات أسعار الصرف الذكية'}
            </span>
            <h2 className="text-2xl font-black text-white leading-tight">
              {language === 'en' ? 'Never Miss the Peak Exchange Rate' : 'لا تفوت أعلى سعر صرف بعد الآن'}
            </h2>
            <p className="text-xs text-[#AFC4D8] max-w-lg mx-auto leading-relaxed">
              {language === 'en'
                ? 'Join our community hub to set customizable push notifications, SMS limits, and email updates. Track instant changes in STC Pay, Urpay, Al Rajhi, and other premium remittance networks.'
                : 'انضم لملتقى مجتمعنا لتفعيل إشعارات مخصصة، تنبيهات رسائل نصية قصيرة، وتحديثات البريد الإلكتروني. تتبع التغيرات اللحظية لأسعار STC Pay و Urpay والراجحي وشبكات التحويل الفاخرة الأخرى.'}
            </p>
          </div>

          {/* Feature highlights grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left rtl:text-right pt-2">
            <div className="p-4 bg-[#031126] rounded-2xl border border-white/10 space-y-1">
              <Sparkles className="w-5 h-5 text-[#FDBA2D]" />
              <h4 className="text-xs font-bold text-white">
                {language === 'en' ? 'Instant Alerts' : 'تنبيهات فورية'}
              </h4>
              <p className="text-[10px] text-[#B8C7D9]/80 leading-snug">
                {language === 'en' ? 'Get notified the second a provider updates rates' : 'استلم إشعاراً في نفس الثانية التي يتم فيها تحديث السعر'}
              </p>
            </div>
            
            <div className="p-4 bg-[#031126] rounded-2xl border border-white/10 space-y-1">
              <MessageSquare className="w-5 h-5 text-[#FDBA2D]" />
              <h4 className="text-xs font-bold text-white">
                {language === 'en' ? 'SMS & Email' : 'رسائل نصية وبريد'}
              </h4>
              <p className="text-[10px] text-[#B8C7D9]/80 leading-snug">
                {language === 'en' ? 'Direct delivery to your preferred contact' : 'وصول مباشر لوسائل الاتصال المفضلة لديك'}
              </p>
            </div>

            <div className="p-4 bg-[#031126] rounded-2xl border border-white/10 space-y-1">
              <ShieldCheck className="w-5 h-5 text-[#00C16A]" />
              <h4 className="text-xs font-bold text-white">
                {language === 'en' ? 'Secure Delivery' : 'تسليم آمن وموثوق'}
              </h4>
              <p className="text-[10px] text-[#B8C7D9]/80 leading-snug">
                {language === 'en' ? 'Private routing with no external third-party tracking' : 'توجيه آمن وخاص بدون أي تتبع خارجي من أطراف أخرى'}
              </p>
            </div>
          </div>

          <div className="pt-4 max-w-xs mx-auto space-y-3.5">
            <button
              id="alerts-lock-unlock-btn"
              onClick={onOpenAuthModal}
              className="w-full py-3.5 bg-gradient-to-r from-[#00C16A] to-[#00E07A] hover:opacity-90 text-[#031126] font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
            >
              <span>{language === 'en' ? 'Sign In / Register Now' : 'تسجيل دخول / إنشاء حساب'}</span>
              {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
            <p className="text-[9px] text-[#B8C7D9]">
              {language === 'en'
                ? 'Join over 10,000+ expats who save daily on remittance transfer fees.'
                : 'انضم لأكثر من ١٠,٠٠٠ مغترب يوفرون يومياً في رسوم وأسعار التحويل.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Form states
  const [corridorId, setCorridorId] = useState<CorridorId>('PK');
  const [providerId, setProviderId] = useState<'all' | ProviderId>('all');
  const [targetRate, setTargetRate] = useState<number>(74.8);
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [contactInfo, setContactInfo] = useState<string>(userSession?.email || '');

  const [showSuccess, setShowSuccess] = useState(false);

  // Set default target rate based on chosen corridor
  const handleCorridorChange = (cid: CorridorId) => {
    setCorridorId(cid);
    const corr = CORRIDORS.find(c => c.id === cid);
    if (corr) {
      setTargetRate(Number((corr.defaultExchangeRate * 1.01).toFixed(2)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetRate <= 0 || !contactInfo.trim()) return;

    addNewAlert({
      corridorId,
      providerId,
      targetRate,
      condition,
      contactInfo,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  // Simulated notifications feed representing triggered rate changes in action (cleared for real registered user accounts)
  const simulatedNotifications = (userSession && !userSession.isGuest) ? [] : [
    {
      id: 'notif-1',
      title: language === 'en' ? 'Urpay Peak Rate Hit!' : 'تم الوصول لأعلى سعر صرف في urpay!',
      desc: language === 'en' 
        ? 'Your alert for Pakistan (above 74.8) was triggered. Current rate: 75.12' 
        : 'تنبيهك لباكستان (أعلى من ٧٤.٨) تم تفعيله. السعر الحالي: ٧٥.١٢',
      time: language === 'en' ? '30 mins ago' : 'قبل ٣٠ دقيقة',
      channel: 'SMS'
    },
    {
      id: 'notif-2',
      title: language === 'en' ? 'STC Pay Rate Update' : 'تحديث سعر صرف STC Pay',
      desc: language === 'en'
        ? 'Your alert for Kenya (above 35.0) was triggered. Current rate: 35.15'
        : 'تنبيهك لكينيا (أعلى من ٣٥.٠) تم تفعيله. السعر الحالي: ٣٥.١٥',
      time: language === 'en' ? '2 hours ago' : 'قبل ساعتين',
      channel: 'Email'
    }
  ];

  return (
    <div className="space-y-8 pb-16 text-white animate-fade-in">
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Bell className="w-8 h-8 text-[#00E07A] animate-swing" />
          <span>{t('alertsTitle')}</span>
        </h1>
        <p className="text-[#AFC4D8] text-sm max-w-2xl leading-relaxed">
          {t('alertsSub')}
        </p>
      </div>

      {/* Grid: Create Alert on left, Active Alerts on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Create Form */}
        <div className="lg:col-span-5 bg-[#061B3A] border border-white/10 p-6 rounded-[24px] shadow-2xl space-y-5">
          <h3 className="font-extrabold text-white border-b border-white/10 pb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
            <PlusCircle className="w-5 h-5 text-[#F4B63F]" />
            <span>{t('createAlert')}</span>
          </h3>

          {showSuccess && (
            <div className="bg-[#00C16A]/10 border border-[#00C16A]/20 text-[#00E07A] p-4 rounded-xl flex items-center gap-2.5 animate-fade-in">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <div className="text-xs font-bold">
                <p>{t('alertCreatedSuccess')}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Corridor Select */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#B8C7D9] uppercase tracking-widest">
                {t('destinationCountry')}
              </label>
              <select
                id="alert-corridor"
                value={corridorId}
                onChange={(e) => handleCorridorChange(e.target.value as CorridorId)}
                className="w-full bg-[#031126] text-white text-sm px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#00C16A] cursor-pointer font-bold"
              >
                {CORRIDORS.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#031126] text-white">
                    {c.flag} {language === 'en' ? c.nameEn : c.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Provider Select */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#B8C7D9] uppercase tracking-widest">
                {t('selectProvider')}
              </label>
              <select
                id="alert-provider"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value as any)}
                className="w-full bg-[#031126] text-white text-sm px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#00C16A] cursor-pointer font-bold"
              >
                <option value="all" className="bg-[#031126]">{t('allProviders')}</option>
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#031126]">{p.name}</option>
                ))}
              </select>
            </div>

            {/* Condition Check */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#B8C7D9] uppercase tracking-widest">
                {t('notifyWhenRate')}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  id="alert-cond-above"
                  onClick={() => setCondition('above')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    condition === 'above'
                      ? 'bg-[#00E07A]/15 border-[#00C16A] text-[#00E07A]'
                      : 'bg-[#031126] border-white/10 text-[#B8C7D9] hover:bg-white/5'
                  }`}
                >
                  📈 {t('above')}
                </button>
                <button
                  type="button"
                  id="alert-cond-below"
                  onClick={() => setCondition('below')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    condition === 'below'
                      ? 'bg-[#00E07A]/15 border-[#00C16A] text-[#00E07A]'
                      : 'bg-[#031126] border-white/10 text-[#B8C7D9] hover:bg-white/5'
                  }`}
                >
                  📉 {t('below')}
                </button>
              </div>
            </div>

            {/* Target Value */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#B8C7D9] uppercase tracking-widest">
                {t('targetValue')} (for 1 SAR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="alert-target-rate"
                  step="0.01"
                  value={targetRate}
                  onChange={(e) => setTargetRate(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#031126] text-white font-mono text-sm px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#00C16A]"
                />
                <span className="absolute right-4 top-2.5 text-xs text-[#B8C7D9] font-bold font-mono">
                  {CORRIDORS.find(c => c.id === corridorId)?.currencyCode}
                </span>
              </div>
            </div>

            {/* Contact method */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#B8C7D9] uppercase tracking-widest">
                {t('notificationMethod')}
              </label>
              <input
                type="text"
                id="alert-contact"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="e.g. email@domain.com or +966..."
                className="w-full bg-[#031126] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#00C16A] font-semibold"
              />
            </div>

            <button
              type="submit"
              id="alert-submit-btn"
              className="w-full py-3 bg-gradient-to-r from-[#00C16A] to-[#00E07A] hover:opacity-90 text-[#031126] font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer uppercase tracking-wider"
            >
              {language === 'en' ? 'Add Expat Alert' : 'إضافة تنبيه المغترب'}
            </button>

          </form>

        </div>

        {/* Right: Active Alerts & Demo Notifications */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Alerts List */}
          <div className="bg-[#061B3A] border border-white/10 p-6 rounded-[24px] shadow-2xl space-y-4">
            <h3 className="font-extrabold text-white flex items-center justify-between pb-2 border-b border-white/10 text-xs uppercase tracking-wider">
              <span>{t('activeAlerts')}</span>
              <span className="text-[10px] font-mono font-bold bg-[#031126] border border-white/10 text-[#00E07A] px-2.5 py-0.5 rounded-full">
                {alerts.length} {language === 'en' ? 'ACTIVE WATCHES' : 'تنبيهات نشطة'}
              </span>
            </h3>

            {alerts.length === 0 ? (
              <div className="text-center py-12 px-4 text-[#B8C7D9]/70 bg-[#031126]/40 border border-white/10 rounded-[20px] flex flex-col items-center justify-center gap-3 animate-empty-state">
                <div className="w-12 h-12 rounded-full bg-[#061B3A] flex items-center justify-center border border-white/10 shadow-inner text-[#B8C7D9]/70">
                  <BellOff className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm mb-1">{language === 'en' ? 'No Active Alerts' : 'لا توجد تنبيهات نشطة'}</p>
                  <p className="text-xs text-[#B8C7D9] max-w-sm mx-auto leading-relaxed">
                    {language === 'en' 
                      ? 'Create a custom rate alert on the left to get notified instantly when your preferred rate is reached.'
                      : 'أنشئ تنبيهاً مخصصاً لسعر الصرف على اليسار ليتم إشعارك فوراً عند وصول السعر المفضل لديك.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const corr = CORRIDORS.find(c => c.id === alert.corridorId);
                  const providerName = alert.providerId === 'all' 
                    ? (language === 'en' ? 'Best Option' : 'أفضل خيار')
                    : (PROVIDERS.find(p => p.id === alert.providerId)?.name || alert.providerId);

                  return (
                    <div
                      key={alert.id}
                      className="border border-white/10 p-4 rounded-xl flex items-center justify-between gap-4 bg-[#031126]/60 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl shrink-0">{corr?.flag}</span>
                        <div>
                          <h4 className="font-extrabold text-xs text-white">
                            SAR to {corr?.nameEn} ({corr?.currencyCode})
                          </h4>
                          <p className="text-[10px] text-[#B8C7D9] font-mono mt-0.5">
                            {providerName} • {alert.condition === 'above' ? '≥' : '≤'} {alert.targetRate} • {alert.contactInfo}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Toggle state button */}
                        <button
                          id={`toggle-alert-${alert.id}`}
                          onClick={() => toggleAlertStatus(alert.id)}
                          className="text-[#B8C7D9] hover:text-[#00E07A] transition-colors cursor-pointer"
                          title="Toggle Active Status"
                        >
                          {alert.isActive ? (
                            <ToggleRight className="w-8 h-8 text-[#00E07A]" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-[#B8C7D9]" />
                          )}
                        </button>

                        {/* Delete button */}
                        <button
                          id={`delete-alert-${alert.id}`}
                          onClick={() => deleteAlert(alert.id)}
                          className="p-1.5 text-[#B8C7D9] hover:text-rose-400 transition-colors rounded-lg hover:bg-white/5 cursor-pointer"
                          title="Delete Alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Triggered Alerts Demo Panel */}
          <div className="bg-[#0B2A5B]/40 border border-white/10 p-6 rounded-[24px] space-y-4 text-white shadow-2xl">
            <h3 className="font-bold text-xs flex items-center gap-1.5 text-[#F4B63F] uppercase tracking-wider font-mono">
              <Sparkles className="w-4 h-4" />
              <span>{t('recentAlertTriggers')}</span>
            </h3>

            <div className="space-y-3.5">
              {simulatedNotifications.length === 0 ? (
                <p className="text-center py-8 text-xs text-[#B8C7D9]">
                  {language === 'en' ? 'No recent alert triggers.' : 'لا توجد تنبيهات نشطة مؤخراً.'}
                </p>
              ) : (
                simulatedNotifications.map((n) => (
                  <div key={n.id} className="bg-[#061B3A] p-3.5 rounded-xl border border-white/10 flex items-start gap-3">
                    <div className="p-2 bg-[#00E07A]/10 text-[#00E07A] rounded-lg shrink-0 mt-0.5">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="text-xs space-y-0.5 w-full">
                      <div className="flex justify-between items-center w-full">
                        <strong className="text-white font-extrabold">{n.title}</strong>
                        <span className="text-[9px] text-[#B8C7D9] font-mono">{n.time} • via {n.channel}</span>
                      </div>
                      <p className="text-[#B8C7D9] font-mono leading-relaxed mt-0.5">{n.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-[#061B3A] p-3 rounded-xl border border-white/10 text-[11px] text-[#B8C7D9] flex gap-1.5 items-center">
              <Info className="w-4 h-4 text-[#F4B63F] shrink-0" />
              <span>
                {language === 'en' 
                  ? 'Alert checks run automatically every 15 minutes across verified digital wallet APIs.' 
                  : 'تتم مراجعة الأسعار تلقائياً كل ١٥ دقيقة عبر واجهات برمجية موثقة للمحافظ الرقمية.'}
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
