import React, { useState } from 'react';
import { CORRIDORS, PROVIDERS } from '../services/ratesService';
import { TranslationDict, UserProfile } from '../types';
import { updateUserProfileInDb } from '../services/supabaseService';
import { Sparkles, MapPin, Check, Landmark, ArrowRight, ArrowLeft, User, Coins } from 'lucide-react';

interface OnboardingProps {
  language: 'en' | 'ar';
  t: TranslationDict;
  profile: UserProfile;
  onComplete: (updatedProfile: UserProfile) => void;
}

export default function Onboarding({
  language,
  t,
  profile,
  onComplete,
}: OnboardingProps) {
  const isRtl = language === 'ar';
  const [step, setStep] = useState<number>(1);
  const [selectedCorridor, setSelectedCorridor] = useState<string>(profile.preferredCorridorId || 'sa-pk');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [monthlyEstimate, setMonthlyEstimate] = useState<number>(1500);

  const activeCorridor = CORRIDORS.find((c) => c.id === selectedCorridor) || CORRIDORS[0];

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Finalize onboarding
      const updatedProfile: UserProfile = {
        ...profile,
        preferredCorridorId: selectedCorridor,
        onboarding_completed: true,
        primary_destination_country: activeCorridor.toCountry,
        primary_destination_currency: activeCorridor.currencyCode,
        preferred_channels: selectedProviders,
        estimated_monthly_send_amount: monthlyEstimate,
      };

      try {
        const session = await import('../services/supabaseService').then((m) => m.getAuthSession());
        if (session.user) {
          await updateUserProfileInDb({
            id: session.user.id,
            name: profile.name,
            phone: profile.phone,
            preferredCorridorId: selectedCorridor,
            language: profile.language,
            email: session.user.email || profile.email,
            onboarding_completed: true,
            primary_destination_country: activeCorridor.toCountry,
            primary_destination_currency: activeCorridor.currencyCode,
            preferred_channels: selectedProviders,
            estimated_monthly_send_amount: monthlyEstimate,
          });

          // Trigger Welcome Notification
          try {
            const { createNotification } = await import('../services/notificationService');
            await createNotification({
              userId: session.user.id,
              audienceType: 'user',
              category: 'system',
              priority: 'high',
              title: profile.language === 'ar' ? 'مرحباً بك في SariRemit!' : 'Welcome to SariRemit!',
              message: profile.language === 'ar'
                ? `أهلاً بك يا ${profile.name}! لقد تم إعداد حسابك بنجاح لمقارنة الأسعار إلى ${activeCorridor.toCountry}.`
                : `Hello ${profile.name}! Your account has been configured to check optimal rates to ${activeCorridor.toCountry}.`,
              actionLabel: profile.language === 'ar' ? 'قارن الأسعار' : 'Compare Rates',
              actionUrl: '/compare',
              payload: { destinationCountry: activeCorridor.toCountry },
              sourceSystem: 'Auth',
              sourceEvent: 'onboarding_completed',
              sourceId: `welcome_${session.user.id}`
            });
          } catch (notifErr) {
            console.warn('[SNS] Failed to trigger welcome notification:', notifErr);
          }
        }
      } catch (err) {
        console.error('Failed to update onboarding state in Supabase:', err);
      }

      onComplete(updatedProfile);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleProvider = (id: string) => {
    if (selectedProviders.includes(id)) {
      setSelectedProviders(selectedProviders.filter((p) => p !== id));
    } else {
      setSelectedProviders([...selectedProviders, id]);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8">
      {/* Container Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Progress Bar Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-sm">
              S
            </div>
            <span className="text-xs font-black font-mono tracking-widest uppercase text-slate-300">
              Welcome to SariRemit
            </span>
          </div>
          <div className="text-xs font-mono font-bold text-emerald-400">
            Step {step} of 3
          </div>
        </div>

        {/* Step Progress Visual Indicator */}
        <div className="w-full bg-slate-100 h-1.5 flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Form Content */}
        <div className="p-6 sm:p-8 space-y-6 min-h-[380px] flex flex-col justify-between">
          <div>
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-2 text-center">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Where do you send money?
                  </h2>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto font-medium">
                    SariRemit optimizes rates specifically for your primary remittance corridor.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Primary Destination Country
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CORRIDORS.map((c) => {
                      const isSelected = selectedCorridor === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCorridor(c.id)}
                          className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 shadow-sm ring-1 ring-emerald-500'
                              : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50/50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{c.flag}</span>
                            <div>
                              <span className="font-bold text-xs block leading-snug">
                                {language === 'en' ? c.toCountry : c.toCountryAr}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-bold leading-none">
                                {c.currencyCode} Corridor
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-2 text-center">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Preferred Channels
                  </h2>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto font-medium">
                    Select the remittance providers you already have accounts with or prefer to use.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      Supported Saudi Providers
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">Select all that apply</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {PROVIDERS.map((p) => {
                      const isSelected = selectedProviders.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleProvider(p.id)}
                          className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/30 text-emerald-900 ring-1 ring-emerald-500'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-extrabold text-white shrink-0 uppercase shadow-xs ${p.logoColor}`}>
                            {p.logoText}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-[11px] block truncate leading-tight text-slate-800">
                              {p.name}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold block leading-none mt-0.5">
                              ⭐ {p.rating} App Rating
                            </span>
                          </div>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-2 text-center">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                    <Coins className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Monthly Sending Estimate
                  </h2>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto font-medium">
                    We use this to estimate your monthly and annual cost savings automatically.
                  </p>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="space-y-1.5 text-center">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                      Estimated Monthly Remittance
                    </span>
                    <span className="text-3xl font-black text-slate-850 font-mono block">
                      {monthlyEstimate.toLocaleString()} <span className="text-sm font-sans font-bold text-slate-400">SAR</span>
                    </span>
                  </div>

                  <div className="px-4">
                    <input
                      type="range"
                      min="500"
                      max="10000"
                      step="250"
                      value={monthlyEstimate}
                      onChange={(e) => setMonthlyEstimate(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold mt-2">
                      <span>500 SAR</span>
                      <span>5,000 SAR</span>
                      <span>10,000 SAR</span>
                    </div>
                  </div>

                  {/* Micro Cost Estimate Benefit */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-left">
                    <span className="text-[9px] font-extrabold text-emerald-600 font-mono tracking-wider block uppercase">
                      💡 Projected Savings Value
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Based on current rates to <strong>{activeCorridor.toCountry}</strong>, sending {monthlyEstimate.toLocaleString()} SAR monthly can save you up to <strong className="text-emerald-600 font-mono">{(monthlyEstimate * 0.045 * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} SAR</strong> annually compared to traditional bank remittances!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer ${
                step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <span>{step === 3 ? 'Finish & View Dashboard' : 'Continue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
