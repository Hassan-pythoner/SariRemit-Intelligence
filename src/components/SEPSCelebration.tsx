import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Sparkles, X, ChevronRight, Share2 } from 'lucide-react';
import { UserAchievement } from '../types';
import { ACHIEVEMENT_DEFINITIONS } from '../services/supabaseService';

interface SEPSCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  newAchievements: UserAchievement[];
  isRtl?: boolean;
}

export const SEPSCelebration: React.FC<SEPSCelebrationProps> = ({
  isOpen,
  onClose,
  newAchievements,
  isRtl = false
}) => {
  useEffect(() => {
    if (isOpen && newAchievements.length > 0) {
      // Play a satisfying achievement unlocked sound or effect if supported
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Quick high chime synth
        const playTone = (freq: number, delay: number, duration: number) => {
          setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
          }, delay);
        };

        playTone(523.25, 0, 0.4); // C5
        playTone(659.25, 150, 0.4); // E5
        playTone(783.99, 300, 0.4); // G5
        playTone(1046.50, 450, 0.8); // C6
      } catch (e) {
        // Audio context block ignored safely
      }
    }
  }, [isOpen, newAchievements]);

  if (!isOpen || newAchievements.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
        {/* Confetti backdrop & ambient particles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#030914]/90 backdrop-blur-md"
          id="celebration-backdrop"
        />

        {/* Floating background sparkles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-[#F59E0B] rounded-full opacity-60"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -40, 0],
                x: [0, Math.random() * 30 - 15, 0],
                scale: [0.6, 1.2, 0.6],
                opacity: [0.2, 0.8, 0.2]
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        {/* Main interactive window card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          className="relative w-full max-w-md bg-[#0C2547] border-2 border-[#F59E0B]/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.2)] z-10 text-center space-y-6"
          id="celebration-modal"
        >
          {/* Confetti Exploding Animation Badge */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            {/* Rotating sunburst aura */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-tr from-[#F59E0B]/10 to-transparent rounded-full border border-dashed border-[#F59E0B]/40"
            />
            
            <motion.div
              animate={{ scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-16 h-16 bg-[#F59E0B]/20 rounded-full flex items-center justify-center border border-[#F59E0B]"
            >
              <Award className="w-8 h-8 text-[#F59E0B]" />
            </motion.div>
            <Sparkles className="absolute top-0 right-0 w-6 h-6 text-[#10B981] animate-bounce" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white tracking-wider uppercase">
              {isRtl ? 'إنجاز جديد تم إحرازه!' : 'ACHIEVEMENT UNLOCKED!'}
            </h2>
            <p className="text-xs text-sds-text-sec max-w-xs mx-auto">
              {isRtl 
                ? 'لقد تمت ترقية رتبة تفاعلك بنجاح لمساهمتك الذكية.' 
                : 'Your smart remittance habits have earned you a specialized badge and progress boost!'}
            </p>
          </div>

          {/* Locked/Unlocked Badges Details */}
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {newAchievements.map(ach => {
              const definition = ACHIEVEMENT_DEFINITIONS.find(def => def.id === ach.achievementId);
              if (!definition) return null;

              return (
                <motion.div
                  key={ach.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="p-3 bg-[#071A35] border border-sds-border rounded-2xl flex items-center gap-3 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white leading-snug">
                      {definition.title}
                    </h4>
                    <p className="text-[10px] text-sds-text-sec leading-snug">
                      {definition.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="pt-2 grid grid-cols-1 gap-2.5">
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#F59E0B] hover:bg-[#d97d02] text-[#071A35] font-black text-xs uppercase tracking-wider rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              id="claim-reward-btn"
            >
              <span>{isRtl ? 'الاستمرار' : 'Claim Reward & Continue'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const text = isRtl 
                  ? `أحرزت إنجازاً جديداً على SariRemit! قارن ووفر في تحويلاتك المالية ذكياً.`
                  : `I just unlocked an achievement on SariRemit! Smart remittance comparison and verified savings tracker!`;
                navigator.clipboard.writeText(text);
                alert(isRtl ? 'تم نسخ نص المشاركة!' : 'Share text copied to clipboard!');
              }}
              className="w-full py-2 bg-[#071A35] hover:bg-[#112F58] border border-sds-border text-slate-300 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'مشاركة الإنجاز' : 'Share Badge'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
