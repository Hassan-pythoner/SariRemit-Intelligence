import React from 'react';
import { motion } from 'motion/react';
import logoSolid from '../assets/images/sariremit_logo_solid_1782780771956.jpg';
import logoTransparent from '../assets/images/sariremit_logo_transparent_1782780465502.jpg';

interface SariRemitLogoProps {
  variant?: 'full' | 'horizontal' | 'icon';
  className?: string;
  light?: boolean; // True when placed on a light-colored background
  animate?: boolean;
  onClick?: () => void;
}

export const SariRemitLogo: React.FC<SariRemitLogoProps> = ({
  variant = 'full',
  className = '',
  light = false,
  animate = false,
  onClick,
}) => {
  const LogoContainer = animate ? motion.div : 'div';
  const animationProps = animate
    ? {
        initial: { opacity: 0, y: -5 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: 'easeOut' },
      }
    : {};

  // Text color based on light parameter
  const sColor = light ? '#0a2346' : '#FFFFFF';
  const rColor = '#F4B63F'; // Brand gold
  const swooshColor = '#F4B63F';

  // Sub-component for Monogram SVG
  const renderMonogram = (sizeClass: string) => (
    <svg
      viewBox="0 0 240 200"
      className={`${sizeClass} select-none`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* S Path */}
      <path
        d="M 115 50 H 80 C 65 50 50 62 50 78 C 50 94 65 106 80 106 H 105 C 120 106 135 118 135 134 C 135 150 120 162 105 162 H 60"
        stroke={sColor}
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* R Path */}
      <path
        d="M 145 50 H 175 C 190 50 205 62 205 78 C 205 94 190 106 175 106 H 145 M 145 106 L 195 162"
        stroke={rColor}
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Swoosh Path - elegant tapered arc */}
      <path
        d="M 60 145 Q 120 110 195 80 Q 120 125 60 145 Z"
        fill={swooshColor}
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <LogoContainer
        {...(animationProps as any)}
        onClick={onClick}
        className={`inline-flex items-center justify-center cursor-pointer select-none transition-all duration-300 hover:scale-105 ${className}`}
      >
        <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#051833] to-[#020b18] border border-white/10 shadow-lg flex items-center justify-center">
          {renderMonogram('w-9 h-9')}
          <div className="absolute bottom-1 w-4 h-0.5 bg-[#F4B63F] rounded-full"></div>
        </div>
      </LogoContainer>
    );
  }

  if (variant === 'horizontal') {
    return (
      <LogoContainer
        {...(animationProps as any)}
        onClick={onClick}
        className={`inline-flex items-center gap-3 cursor-pointer select-none transition-all duration-300 hover:opacity-95 ${className}`}
      >
        {/* Cropped brand SR mark for horizontal layout */}
        <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-[#051833] to-[#020b18] border border-white/10 shadow-md flex items-center justify-center">
          {renderMonogram('w-7.5 h-7.5')}
          <div className="absolute bottom-1 w-3 h-0.5 bg-[#F4B63F] rounded-full"></div>
        </div>

        {/* Text Part */}
        <div className="flex flex-col justify-center">
          <div className="font-sans text-xl tracking-tight flex items-center">
            <span className={`font-light ${light ? 'text-[#0a2346]' : 'text-white'}`}>Sari</span>
            <span className="font-black text-[#F4B63F]">Remit</span>
          </div>
          <span className="text-[7.5px] font-semibold tracking-[0.15em] uppercase text-[#F4B63F] select-none">
            Helping Expats Save
          </span>
        </div>
      </LogoContainer>
    );
  }

  // Full default layout (for Loading screen, login/signup, landing hero, etc.)
  return (
    <LogoContainer
      {...(animationProps as any)}
      onClick={onClick}
      className={`flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all duration-300 ${className}`}
    >
      {/* Centered Large SR Monogram */}
      <div className="relative flex items-center justify-center w-36 h-30 rounded-2xl bg-gradient-to-br from-[#051833] to-[#020b18] border border-white/10 shadow-2xl p-4 mb-4 transition-colors duration-300 hover:border-[#F4B63F]/20">
        {renderMonogram('w-24 h-24')}
      </div>

      <div className="flex flex-col items-center">
        {/* Brand Name */}
        <h1 className="font-sans text-4xl tracking-wide flex items-center select-none font-bold uppercase">
          <span className={light ? 'text-[#0a2346]' : 'text-white'}>Sari</span>
          <span className="text-[#F4B63F]">Remit</span>
        </h1>
        
        {/* Tagline exactly matching uploaded image */}
        <p className="text-xs font-semibold text-[#F4B63F] tracking-wide mt-2 font-sans opacity-95">
          Helping Expats Make every riyal count
        </p>

        {/* Pointed tapered underline lens */}
        <svg viewBox="0 0 300 10" className="w-56 h-2 mt-3" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 20 5 Q 150 2 280 5 Q 150 8 20 5 Z" fill="#F4B63F" />
        </svg>
      </div>
    </LogoContainer>
  );
};


