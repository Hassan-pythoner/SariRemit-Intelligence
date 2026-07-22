import React from 'react';
import { getProviderVisualIdentity, ProviderVisualIdentity } from '../../services/providerVisualIdentityService';
import { AuroraLayer } from './AuroraLayer';

interface AdaptiveRecommendationSurfaceProps {
  providerId?: string;
  isUpdating?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AdaptiveRecommendationSurface({
  providerId,
  isUpdating = false,
  children,
  className = '',
}: AdaptiveRecommendationSurfaceProps) {
  const identity: ProviderVisualIdentity = getProviderVisualIdentity(providerId);

  return (
    <div
      className={`relative rounded-3xl border border-sds-border bg-sds-card shadow-sds-md p-6 sm:p-7 overflow-hidden text-sds-text transition-all duration-500 ${className}`}
      style={{
        // Custom provider variables for localized styling
        ['--provider-primary' as any]: identity.primaryColor,
        ['--provider-secondary' as any]: identity.secondaryColor,
      }}
    >
      {/* Signature Aurora Ambient Layer (Background) */}
      <AuroraLayer
        primaryColor={identity.primaryColor}
        secondaryColor={identity.secondaryColor}
        accentGlow={identity.accentGlow}
        isUpdating={isUpdating}
      />

      {/* Glossy Refinement Surface */}
      <div className="relative z-10 space-y-6">
        {children}
      </div>
    </div>
  );
}
