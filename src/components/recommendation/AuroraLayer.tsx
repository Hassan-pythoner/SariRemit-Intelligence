import React, { useEffect, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AuroraLayerProps {
  primaryColor: string;
  secondaryColor?: string;
  accentGlow?: string;
  isUpdating?: boolean;
}

export function AuroraLayer({
  primaryColor,
  secondaryColor,
  accentGlow,
  isUpdating = false,
}: AuroraLayerProps) {
  const prefersReducedMotion = useReducedMotion();
  const [sheenActive, setSheenActive] = useState<boolean>(false);

  useEffect(() => {
    if (isUpdating && !prefersReducedMotion) {
      setSheenActive(true);
      const timer = setTimeout(() => {
        setSheenActive(false);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [isUpdating, prefersReducedMotion]);

  const secColor = secondaryColor || primaryColor;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem] z-0 select-none"
    >
      {/* Aurora Ambient Gradient Orbs */}
      <div
        className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-20 transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full blur-2xl opacity-15 transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${secColor} 0%, transparent 70%)`,
        }}
      />

      {/* Subtle Provider Tinted Grid Sheen */}
      <div
        className="absolute inset-0 opacity-10 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}15 0%, transparent 50%, ${secColor}10 100%)`,
        }}
      />

      {/* Glossy Top Edge Highlight Reflection */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* One-Time Sweep Sheen Animation on Intelligence Update */}
      {sheenActive && !prefersReducedMotion && (
        <div
          className="absolute inset-0 pointer-events-none animate-pulse"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentGlow || 'rgba(255,255,255,0.15)'} 50%, transparent 100%)`,
            transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}
    </div>
  );
}
