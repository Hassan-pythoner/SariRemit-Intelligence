import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Check, ArrowRight, ArrowLeft } from 'lucide-react';

interface SavingsCelebrationProps {
  amount: number;
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'ar';
}

interface Coin {
  id: number;
  x: number;
  y: number;
  delay: number;
  rotation: number;
  scale: number;
}

export const SavingsCelebration: React.FC<SavingsCelebrationProps> = ({
  amount,
  isOpen,
  onClose,
  language,
}) => {
  const [coins, setCoins] = useState<Coin[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Generate random positions/delays for 12 golden coins
      const generatedCoins = Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        // Random horizontal spreading (-160px to 160px)
        x: (Math.random() - 0.5) * 320,
        // Random peak height (-180px to -320px)
        y: -180 - Math.random() * 160,
        delay: Math.random() * 0.4,
        rotation: (Math.random() - 0.5) * 720,
        scale: 0.8 + Math.random() * 0.6,
      }));
      setCoins(generatedCoins);

      // Auto dismiss after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  const isRtl = language === 'ar';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden pointer-events-none">
          
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs pointer-events-auto"
            onClick={onClose}
          />

          {/* Golden Coin Fountain Layer (behind the card) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {coins.map((coin) => (
              <motion.div
                key={coin.id}
                initial={{ x: 0, y: 150, scale: 0, opacity: 0, rotate: 0 }}
                animate={{
                  x: coin.x,
                  y: coin.y,
                  scale: [0, coin.scale, coin.scale, 0],
                  opacity: [0, 1, 1, 0],
                  rotate: coin.rotation,
                }}
                transition={{
                  duration: 1.6,
                  delay: coin.delay,
                  ease: [0.1, 0.8, 0.3, 1],
                }}
                className="absolute text-3xl select-none"
              >
                🪙
              </motion.div>
            ))}
          </div>

          {/* Celebration Card */}
          <motion.div
            initial={{ scale: 0.85, y: 60, opacity: 0 }}
            animate={{ 
              scale: 1, 
              y: 0, 
              opacity: 1,
              transition: { type: 'spring', damping: 16, stiffness: 140 }
            }}
            exit={{ 
              scale: 0.9, 
              y: 20, 
              opacity: 0,
              transition: { duration: 0.25 }
            }}
            className="relative bg-slate-900 border border-emerald-500/30 text-white max-w-md w-full rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden pointer-events-auto text-center p-6 border-b-4 border-b-emerald-500"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full filter blur-xl"></div>
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-green-500/10 rounded-full filter blur-xl"></div>

            <div className="relative space-y-5">
              
              {/* Animated Icon Header */}
              <div className="flex justify-center">
                <motion.div
                  initial={{ rotate: -20, scale: 0.5 }}
                  animate={{ 
                    rotate: [0, -10, 10, -5, 5, 0],
                    scale: 1,
                    transition: { delay: 0.2, duration: 0.6 }
                  }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                >
                  <Trophy className="w-8 h-8 text-slate-900 stroke-[2.5]" />
                </motion.div>
              </div>

              {/* Congratulatory texts */}
              <div className="space-y-2">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.4 } }}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  {language === 'en' ? 'HIGH PAYOUT SAVED!' : 'تم تسجيل توفير عالٍ!'}
                </motion.span>

                <h3 className="text-2xl font-black tracking-tight text-white leading-tight">
                  {language === 'en' ? 'Smart Move!' : 'خطوة ذكية!'}
                </h3>
                
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  {language === 'en' 
                    ? 'You chose the highest-value channel and saved a substantial amount of money. Every Riyal counts!' 
                    : 'لقد اخترت القناة الأعلى قيمة ووفرت مبلغاً مجزياً من أموالك. كل ريال يصنع فرقاً!'}
                </p>
              </div>

              {/* Huge Saved amount display */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, transition: { delay: 0.5, type: 'spring' } }}
                className="bg-emerald-500/10 border border-emerald-500/20 py-4 px-6 rounded-2xl inline-block"
              >
                <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase block font-sans">
                  {language === 'en' ? 'REMITTANCE SAVINGS RECORDED' : 'مدخرات الحوالة المسجلة'}
                </span>
                <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight mt-1">
                  +{amount.toFixed(2)} <span className="text-sm font-sans font-extrabold text-emerald-500">SAR</span>
                </div>
              </motion.div>

              {/* Progression hint */}
              <p className="text-[11px] text-slate-400">
                {language === 'en'
                  ? 'Your Expat Rank has been credited and progress is updated!'
                  : 'تم تحديث رصيد مستوى المغترب الخاص بك وتحديث تقدمك!'}
              </p>

              {/* Call-to-action to proceed/close */}
              <div className="pt-2">
                <button
                  id="celebration-dismiss-btn"
                  onClick={onClose}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{language === 'en' ? 'Awesome, Got It!' : 'رائع، فهمت!'}</span>
                  {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>

            </div>
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
};
