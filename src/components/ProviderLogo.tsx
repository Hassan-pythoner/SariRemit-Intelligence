import React from 'react';

interface ProviderLogoProps {
  providerId: string;
  className?: string; // Tailwind styling classes such as "w-12 h-12 rounded-xl"
}

export const ProviderLogo: React.FC<ProviderLogoProps> = ({ providerId, className = "w-12 h-12" }) => {
  const normalizedId = providerId.toLowerCase().replace(/[^a-z]/g, '');

  switch (normalizedId) {
    case 'stcpay':
      return (
        <div className={`overflow-hidden shrink-0 shadow-sm ${className}`} id={`logo-stcpay`}>
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#4f008c" />
            {/* Custom stylized geometric lowercase 'stc' */}
            <path d="M22 45 C22 37, 34 37, 34 42 C34 47, 22 45, 22 52 C22 58, 34 58, 34 52" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M44 34 V59 M39 41 H49" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
            <path d="M64 45 C64 37, 52 37, 52 45 C52 53, 64 53, 64 53" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
            {/* stc brand signature red/coral accent circle */}
            <circle cx="73" cy="36" r="5" fill="#FF3E6C" />
            {/* Clean sub-brand text */}
            <text x="50" y="82" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="900" letterSpacing="1" fontFamily="system-ui, sans-serif">PAY</text>
          </svg>
        </div>
      );

    case 'urpay':
      return (
        <div className={`overflow-hidden shrink-0 shadow-sm ${className}`} id={`logo-urpay`}>
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#0D132D" />
            {/* Neon teal / blue circular flowing gradient loops representing 'ur' logo */}
            <circle cx="50" cy="46" r="38" fill="url(#urpay-bg-glow)" opacity="0.15" />
            
            {/* Stylized interconnected vector loops for u and r */}
            <path d="M30 36 V48 C30 57, 44 57, 44 48 V36" stroke="#00E5FF" strokeWidth="7.5" strokeLinecap="round" />
            <path d="M44 43 C44 35, 58 35, 58 43 V56" stroke="#0077FF" strokeWidth="7.5" strokeLinecap="round" />
            <path d="M58 46 H48" stroke="#0077FF" strokeWidth="6" strokeLinecap="round" />
            
            {/* urpay branding text */}
            <text x="50" y="82" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="0.5">urpay</text>
            <defs>
              <linearGradient id="urpay-bg-glow" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00E5FF" />
                <stop offset="1" stopColor="#0077FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );

    case 'mobilypay':
      return (
        <div className={`overflow-hidden shrink-0 shadow-sm ${className}`} id={`logo-mobilypay`}>
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#00A3E0" />
            {/* Overlapping organic spheres reflecting Mobily brand identity */}
            <circle cx="40" cy="40" r="15" fill="#00E5FF" opacity="0.8" />
            <circle cx="60" cy="40" r="15" fill="#054A91" opacity="0.9" />
            <circle cx="50" cy="58" r="15" fill="#7CFC00" opacity="0.85" />
            
            {/* Interlocking white curves of modern 'm' */}
            <path d="M32 40 Q50 20 68 40 Q50 68 32 40" stroke="#FFFFFF" strokeWidth="3" fill="none" opacity="0.4" />
            
            <text x="50" y="84" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="900" letterSpacing="0.5" fontFamily="system-ui, sans-serif">Mobily Pay</text>
          </svg>
        </div>
      );

    case 'enjaz':
      return (
        <div className={`overflow-hidden shrink-0 shadow-sm ${className}`} id={`logo-enjaz`}>
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#C69214" />
            {/* Dynamic, swift white/gold falcon-wing sweep representing fast transfers */}
            <path d="M22 46 C38 30, 78 44, 78 44 C78 44, 46 56, 22 46 Z" fill="#FFFFFF" opacity="0.95" />
            <path d="M28 56 C40 43, 72 54, 72 54 C72 54, 46 64, 28 56 Z" fill="#FFD700" />
            
            <circle cx="75" cy="44" r="3" fill="#D2A03E" />
            <text x="50" y="82" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="900" letterSpacing="1.2" fontFamily="system-ui, sans-serif">ENJAZ</text>
          </svg>
        </div>
      );

    case 'quickpay':
      return (
        <div className={`overflow-hidden shrink-0 shadow-sm ${className}`} id={`logo-quickpay`}>
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#005B41" />
            {/* SNB Corporate gold geometric flower emblem & QuickPay branding */}
            <path d="M50 18 C62 18, 70 26, 70 38 C70 54, 50 68, 50 68 C50 68, 30 54, 30 38 C30 26, 38 18, 50 18 Z" fill="#D4AF37" />
            <path d="M50 24 C58 24, 64 30, 64 38 C64 50, 50 60, 50 60 C50 60, 36 50, 36 38 C36 30, 42 24, 50 24 Z" fill="#FFFFFF" />
            
            <text x="50" y="82" textAnchor="middle" fill="#FFFFFF" fontSize="11.5" fontWeight="900" letterSpacing="0.5" fontFamily="system-ui, sans-serif">QuickPay</text>
          </svg>
        </div>
      );

    case 'westernunion':
      return (
        <div className={`overflow-hidden shrink-0 shadow-sm ${className}`} id={`logo-westernunion`}>
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#FFCC00" />
            {/* Signature Bold Black WU lettermark */}
            <text x="50" y="48" textAnchor="middle" fill="#000000" fontSize="36" fontWeight="900" fontFamily="Impact, system-ui, sans-serif" letterSpacing="-2">WU</text>
            <rect x="22" y="54" width="56" height="5" fill="#000000" />
            <text x="50" y="74" textAnchor="middle" fill="#000000" fontSize="8.5" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="0.8">WESTERN</text>
            <text x="50" y="86" textAnchor="middle" fill="#000000" fontSize="8.5" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="0.8">UNION</text>
          </svg>
        </div>
      );

    case 'alrajhi':
    case 'tahweelalrajhi':
      return (
        <div className={`overflow-hidden shrink-0 shadow-sm ${className}`} id={`logo-alrajhi`}>
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#00529B" />
            {/* Classic Al Rajhi Bank royal blue & geometric octagonal blue grid trellis flower */}
            <path d="M50 18 L68 28 L68 50 L50 60 L32 50 L32 28 Z" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="#003D73" />
            <path d="M50 23 L62 30 L62 46 L50 53 L38 46 L38 30 Z" fill="#00E5FF" />
            <circle cx="50" cy="37" r="4.5" fill="#FFFFFF" />
            
            <text x="50" y="78" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="900" letterSpacing="0.3" fontFamily="system-ui, sans-serif">Tahweel</text>
            <text x="50" y="89" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="800" opacity="0.9" fontFamily="system-ui, sans-serif" letterSpacing="0.3">AL RAJHI</text>
          </svg>
        </div>
      );

    default:
      return (
        <div className={`bg-gradient-to-br from-slate-600 to-slate-800 text-white font-black flex items-center justify-center shrink-0 shadow-sm ${className}`} id={`logo-fallback-${normalizedId}`}>
          {providerId ? providerId.charAt(0).toUpperCase() : 'P'}
        </div>
      );
  }
};
