import React, { useState, useEffect } from 'react';
import { TranslationDict, Corridor, RateAlert } from '../types';
import { CORRIDORS, PROVIDERS, getAlerts, saveAlert, toggleAlert, deleteAlert } from '../services/ratesService';
import { getAuthSession } from '../services/supabaseService';
import { 
  Bell, PlusCircle, Trash2, Smartphone, MessageSquare, Mail, 
  ToggleLeft, ToggleRight, Sparkles, CheckCircle2, AlertCircle 
} from 'lucide-react';

interface AlertsProps {
  language: 'en' | 'ar';
  t: TranslationDict;
  onAlertCreated: () => void;
}

export default function Alerts({
  language,
  t,
  onAlertCreated,
}: AlertsProps) {
  const isRtl = language === 'ar';
  
  // State management
  const [alertsList, setAlertsList] = useState<RateAlert[]>([]);
  const [corridorId, setCorridorId] = useState<string>(() => {
    const session = getAuthSession();
    return session.user?.preferredCorridorId || 'sa-pk';
  });
  const [targetRate, setTargetRate] = useState<string>('');
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');
  
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    setAlertsList(getAlerts());
  }, []);

  const activeCorridor = CORRIDORS.find(c => c.id === corridorId) || CORRIDORS[0];

  // Set default target rate when corridor changes
  useEffect(() => {
    // Propose a target slightly higher than base rate (e.g., +1%)
    const proposed = (activeCorridor.baseExchangeRate * 1.01).toFixed(2);
    setTargetRate(proposed);
  }, [corridorId]);

  const handleToggle = (id: string) => {
    const updated = toggleAlert(id);
    setAlertsList(updated);
  };

  const handleDelete = (id: string) => {
    const updated = deleteAlert(id);
    setAlertsList(updated);
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedTarget = parseFloat(targetRate);
    if (!targetRate || isNaN(parsedTarget) || parsedTarget <= 0) {
      setErrorMsg(language === 'en' ? 'Please enter a valid target rate' : 'الرجاء إدخال سعر مستهدف صحيح');
      return;
    }

    const created = saveAlert({
      corridorId,
      targetRate: parsedTarget,
      type: alertType,
      channel,
    });

    setAlertsList(prev => [created, ...prev]);
    setSuccess(true);
    onAlertCreated();

    // Reset success banner
    setTimeout(() => {
      setSuccess(false);
    }, 4000);
  };

  return (
    <div className="space-y-8 pb-24">
      
      {/* Page Header */}
      <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
        <h1 className="text-2xl sm:text-3xl font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Bell className="w-7 h-7 text-emerald-600 shrink-0" />
          {t.alerts}
        </h1>
        <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
          {t.alertMeDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Create New Alert Form (Col span 5) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h3 className={`text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Set New Live Alert</span>
          </h3>

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Rate alert set successfully! We'll ping you.</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateAlert} className="space-y-4">
            {/* Choose corridor */}
            <div className="space-y-1.5 text-left">
              <label className={`block text-[10px] font-extrabold text-slate-450 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>
                {t.chooseCountry}
              </label>
              <select
                value={corridorId}
                onChange={(e) => setCorridorId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-colors"
              >
                {CORRIDORS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flag} {language === 'en' ? c.toCountry : c.toCountryAr} ({c.currencyCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Target condition & target rate */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 text-left">
                <label className={`block text-[10px] font-extrabold text-slate-450 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>
                  Condition
                </label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as 'above' | 'below')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-colors"
                >
                  <option value="above">Goes Above</option>
                  <option value="below">Goes Below</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className={`block text-[10px] font-extrabold text-slate-450 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>
                  Target Rate
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={targetRate}
                    onChange={(e) => setTargetRate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-450 text-xs font-bold font-mono">
                    {activeCorridor.currencyCode}
                  </div>
                </div>
              </div>
            </div>

            <div className={`text-[10px] text-slate-450 font-bold ${isRtl ? 'text-right' : 'text-left'}`}>
              Current live rate: <span className="text-slate-600 font-mono font-bold">1 SAR ≈ {activeCorridor.baseExchangeRate} {activeCorridor.currencyCode}</span>
            </div>

            {/* Notification channel */}
            <div className="space-y-1.5 text-left">
              <label className={`block text-[10px] font-extrabold text-slate-450 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>
                Notification Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    channel === 'whatsapp'
                      ? 'border-emerald-500 bg-emerald-50/55 text-emerald-800 font-bold shadow-xs'
                      : 'border-slate-200 text-slate-500 hover:border-emerald-500 hover:bg-slate-50/50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] font-bold">WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    channel === 'sms'
                      ? 'border-emerald-500 bg-emerald-50/55 text-emerald-800 font-bold shadow-xs'
                      : 'border-slate-200 text-slate-500 hover:border-emerald-500 hover:bg-slate-50/50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px] font-bold">SMS Text</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    channel === 'email'
                      ? 'border-emerald-500 bg-emerald-50/55 text-emerald-800 font-bold shadow-xs'
                      : 'border-slate-200 text-slate-500 hover:border-emerald-500 hover:bg-slate-50/50'
                  }`}
                >
                  <Mail className="w-4 h-4 text-purple-600" />
                  <span className="text-[10px] font-bold">Email</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="alerts-create-btn"
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.createAlertBtn}</span>
            </button>
          </form>
        </div>

        {/* Right Side: Active Alert List (Col span 7) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className={`text-sm font-extrabold text-slate-800 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>
            {t.activeAlerts}
          </h3>

          <div className="space-y-3">
            {alertsList.length === 0 ? (
              <div className="py-12 text-center rounded-xl border border-dashed border-slate-250 bg-slate-50">
                <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-400 mt-2 font-bold uppercase">{t.noAlerts}</p>
              </div>
            ) : (
              alertsList.map((alert) => {
                const corr = CORRIDORS.find(c => c.id === alert.corridorId) || CORRIDORS[0];
                
                const getChannelIcon = (ch: 'whatsapp' | 'sms' | 'email') => {
                  if (ch === 'whatsapp') return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
                  if (ch === 'sms') return <Smartphone className="w-3.5 h-3.5 text-blue-600" />;
                  return <Mail className="w-3.5 h-3.5 text-purple-600" />;
                };

                return (
                  <div 
                    key={alert.id}
                    id={`alert-card-${alert.id}`}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                      alert.active 
                        ? 'border-slate-200 bg-white shadow-xs' 
                        : 'border-slate-100 bg-slate-50/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Flag flag circle */}
                      <div className="w-9 h-9 rounded-full bg-slate-50 text-xl flex items-center justify-center border border-slate-150 shrink-0 shadow-xs">
                        {corr.flag}
                      </div>
                      
                      <div className="space-y-0.5 text-left">
                        <span className="text-xs font-bold text-slate-850 block">
                          SAR to {language === 'en' ? corr.toCountry : corr.toCountryAr}
                        </span>
                        
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] bg-slate-100 text-slate-650 px-1.5 py-0.5 rounded font-mono font-black">
                            {alert.type === 'above' ? '≥' : '≤'} {alert.targetRate} {corr.currencyCode}
                          </span>
                          
                          <div className="flex items-center gap-1 bg-slate-100/50 px-1.5 py-0.5 rounded text-[10px] font-extrabold text-slate-450 uppercase font-mono">
                            {getChannelIcon(alert.channel)}
                            <span>{alert.channel}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Toggle status */}
                      <button
                        onClick={() => handleToggle(alert.id)}
                        className="text-slate-400 hover:text-emerald-600 transition-colors focus:outline-none cursor-pointer"
                      >
                        {alert.active ? (
                          <ToggleRight className="w-7 h-7 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-slate-300" />
                        )}
                      </button>

                      {/* Delete rate alert */}
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl space-y-1.5 text-xs text-slate-450 text-left">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <AlertCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Why set alerts?
            </h4>
            <p className="leading-relaxed font-semibold">
              Expats often miss the best transfer window due to work schedules. SariRemit checks the crowd-sourced system continuously and dispatches an instant WhatsApp/SMS free of charge when rates spike or meet your target.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
