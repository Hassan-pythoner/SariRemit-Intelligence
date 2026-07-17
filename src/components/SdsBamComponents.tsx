import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Sparkles, AlertTriangle, ShieldCheck, 
  HelpCircle, Trophy, Globe, Award, Bell, Info, RefreshCw,
  ExternalLink, UserCheck, ShieldAlert, Heart
} from 'lucide-react';
import { 
  getSariRemitLogo, 
  getSariRemitMonogram, 
  getProviderBranding, 
  getCountryFlag, 
  getCorridorIcon, 
  getBadgeAsset, 
  getAchievementIcon, 
  getIllustration, 
  getPartnerLogo,
  resolveNotificationAsset,
  BrandSurface, 
  BrandAssetSize, 
  ResolvedBrandAsset,
  SDS_ASSET_SIZES
} from '../services/bamAssetResolver';
import { getProviderIdentity } from '../services/pisService';

// Development warning helper
const runDevWarning = (message: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[SDS BAM DEV WARNING]: ${message}`);
  }
};

/* ==========================================================================
   ASSET SKELETON
   ========================================================================== */
interface AssetSkeletonProps {
  size?: BrandAssetSize;
  shape?: 'square' | 'rounded' | 'circle' | 'natural';
  className?: string;
  id?: string;
}

export function AssetSkeleton({ size = 'md', shape = 'rounded', className = '', id }: AssetSkeletonProps) {
  const shapeClass = {
    square: 'rounded-none',
    rounded: 'rounded-xl',
    circle: 'rounded-full',
    natural: 'rounded-lg'
  }[shape];

  const sizeClass = SDS_ASSET_SIZES[size] || SDS_ASSET_SIZES.md;

  return (
    <div
      id={id}
      className={`bg-slate-200/50 dark:bg-slate-800/40 animate-pulse shrink-0 ${sizeClass} ${shapeClass} ${className}`}
      style={{ minWidth: size === 'xs' ? '20px' : size === 'sm' ? '28px' : size === 'md' ? '40px' : size === 'lg' ? '56px' : '80px' }}
    />
  );
}

/* ==========================================================================
   ASSET FALLBACK
   ========================================================================== */
interface AssetFallbackProps {
  initials: string;
  size?: BrandAssetSize;
  shape?: 'square' | 'rounded' | 'circle' | 'natural';
  bgColor?: string;
  surface?: BrandSurface;
  className?: string;
  id?: string;
}

export function AssetFallback({ 
  initials, 
  size = 'md', 
  shape = 'rounded', 
  bgColor = '#10B981', 
  surface = 'light',
  className = '',
  id 
}: AssetFallbackProps) {
  const shapeClass = {
    square: 'rounded-none',
    rounded: 'rounded-xl',
    circle: 'rounded-full',
    natural: 'rounded-xl'
  }[shape];

  const sizeClass = SDS_ASSET_SIZES[size] || SDS_ASSET_SIZES.md;

  const fontSizes = {
    xs: 'text-[9px] font-black',
    sm: 'text-[11px] font-black',
    md: 'text-[14px] font-black',
    lg: 'text-[18px] font-black',
    xl: 'text-[24px] font-black',
  };

  return (
    <div
      id={id}
      className={`flex items-center justify-center shrink-0 text-white select-none ${sizeClass} ${shapeClass} ${className}`}
      style={{ 
        backgroundColor: bgColor,
        minWidth: size === 'xs' ? '20px' : size === 'sm' ? '28px' : size === 'md' ? '40px' : size === 'lg' ? '56px' : '80px',
        minHeight: size === 'xs' ? '20px' : size === 'sm' ? '28px' : size === 'md' ? '40px' : size === 'lg' ? '56px' : '80px',
      }}
    >
      <span className={fontSizes[size] || 'text-xs'}>{initials || 'SR'}</span>
    </div>
  );
}

/* ==========================================================================
   SARIREMIT LOGO COMPONENT
   ========================================================================== */
interface SariRemitLogoProps {
  variant?: 'primary' | 'monogram' | 'wordmark' | 'logo_with_slogan' | 'light' | 'dark' | 'compact' | 'favicon-style';
  surface?: BrandSurface;
  size?: BrandAssetSize;
  showSlogan?: boolean;
  className?: string;
  id?: string;
}

export function SariRemitLogo({
  variant = 'primary',
  surface = 'light',
  size = 'md',
  showSlogan,
  className = '',
  id
}: SariRemitLogoProps) {
  const resolved = variant === 'monogram' || variant === 'favicon-style' 
    ? getSariRemitMonogram(surface, size) 
    : getSariRemitLogo(surface, size);

  const [imgState, setImgState] = useState<'loading' | 'success' | 'error'>(resolved.url ? 'loading' : 'error');

  useEffect(() => {
    if (resolved.url) {
      setImgState('loading');
    } else {
      setImgState('error');
    }
  }, [resolved.url]);

  const sizeClass = SDS_ASSET_SIZES[size] || SDS_ASSET_SIZES.md;

  // Render official BAM image logo if successful
  if (resolved.url && imgState !== 'error') {
    return (
      <div id={id} className={`flex items-center gap-2.5 ${className}`}>
        <div className="relative shrink-0">
          {imgState === 'loading' && <AssetSkeleton size={size} shape="rounded" />}
          <img
            src={resolved.url}
            alt={resolved.altText}
            referrerPolicy="no-referrer"
            onLoad={() => setImgState('success')}
            onError={() => {
              runDevWarning('SariRemitLogo failed to load from URL: ' + resolved.url);
              setImgState('error');
            }}
            className={`${sizeClass} rounded-xl object-contain transition-all ${imgState === 'loading' ? 'hidden' : 'block'}`}
          />
        </div>
        {variant !== 'monogram' && variant !== 'favicon-style' && (
          <div className="flex flex-col text-left">
            <span className="font-sans font-black tracking-tight text-slate-900 dark:text-white leading-none">
              SariRemit
            </span>
            {(variant === 'logo_with_slogan' || showSlogan) && (
              <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest mt-1">
                Know Before You Send.
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Pure CSS / SDS Fallback rendering
  const containerSizes = {
    xs: 'w-6 h-6 rounded-md text-xs',
    sm: 'w-7 h-7 rounded-lg text-sm',
    md: 'w-10 h-10 rounded-xl text-lg',
    lg: 'w-14 h-14 rounded-2xl text-2xl',
    xl: 'w-20 h-20 rounded-3xl text-3xl',
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-3xl',
  };

  const isDarkSurface = surface === 'dark';

  return (
    <div id={id} className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${containerSizes[size]} bg-emerald-600 flex items-center justify-center font-black text-white relative shrink-0 transition-all hover:scale-105`}>
        <span>S</span>
        <span className="text-amber-500 absolute bottom-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
      </div>
      {variant !== 'monogram' && variant !== 'favicon-style' && (
        <div className="flex flex-col text-left">
          <span className={`font-sans font-black tracking-tight ${isDarkSurface ? 'text-white' : 'text-slate-850'} ${textSizes[size]} leading-none`}>
            SariRemit
          </span>
          {(variant === 'logo_with_slogan' || showSlogan) && (
            <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest mt-1">
              Know Before You Send.
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   SARIREMIT MONOGRAM COMPONENT
   ========================================================================== */
interface SariRemitMonogramProps {
  surface?: BrandSurface;
  size?: BrandAssetSize;
  className?: string;
  id?: string;
}

export function SariRemitMonogram({ surface = 'light', size = 'md', className = '', id }: SariRemitMonogramProps) {
  return (
    <SariRemitLogo
      variant="monogram"
      surface={surface}
      size={size}
      className={className}
      id={id}
    />
  );
}

/* ==========================================================================
   PROVIDER LOGO COMPONENT
   ========================================================================== */
interface ProviderLogoProps {
  channel: any;
  size?: BrandAssetSize;
  surface?: BrandSurface;
  shape?: 'square' | 'rounded' | 'circle' | 'natural';
  showName?: boolean;
  showFallback?: boolean;
  className?: string;
  id?: string;
}

export function ProviderLogo({
  channel,
  size = 'md',
  surface = 'light',
  shape = 'rounded',
  showName = false,
  showFallback = true,
  className = '',
  id
}: ProviderLogoProps) {
  const resolved = getProviderBranding(channel, surface);
  const [imgState, setImgState] = useState<'loading' | 'success' | 'error'>(resolved.url ? 'loading' : 'error');

  useEffect(() => {
    if (resolved.url) {
      setImgState('loading');
    } else {
      setImgState('error');
    }
  }, [resolved.url]);

  // Handle missing properties warnings in development mode
  useEffect(() => {
    if (!channel) {
      runDevWarning('ProviderLogo component received a null or undefined channel.');
      return;
    }
    const legacyUrl = channel.logoUrl || channel.logo_url;
    if (resolved.source === 'sds_fallback' && !legacyUrl) {
      runDevWarning(`Provider '${channel.displayName || channel.providerName || 'Unknown'}' has no active official BAM brand asset and no legacy logoUrl.`);
    }
    if (!resolved.altText) {
      runDevWarning(`Branding altText is missing for channel: ${channel.displayName}`);
    }
  }, [channel, resolved]);

  const shapeClass = {
    square: 'rounded-none',
    rounded: 'rounded-xl',
    circle: 'rounded-full',
    natural: 'rounded-lg'
  }[shape];

  const sizeClass = SDS_ASSET_SIZES[size] || SDS_ASSET_SIZES.md;

  const renderImage = () => {
    if (resolved.url && imgState !== 'error') {
      return (
        <div className="relative shrink-0 flex items-center justify-center">
          {imgState === 'loading' && <AssetSkeleton size={size} shape={shape} />}
          <img
            src={resolved.url}
            alt={resolved.altText}
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={() => setImgState('success')}
            onError={() => {
              runDevWarning(`Failed to load image URL: ${resolved.url} for channel ${channel?.displayName || 'Unknown'}. Switching to next fallback.`);
              setImgState('error');
            }}
            className={`${sizeClass} ${shapeClass} object-contain bg-white p-1 transition-all duration-200 ${imgState === 'loading' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
          />
        </div>
      );
    }

    if (showFallback) {
      return (
        <AssetFallback
          initials={resolved.fallbackInitials || 'PR'}
          size={size}
          shape={shape}
          bgColor={resolved.primaryColor || '#10B981'}
          surface={surface}
        />
      );
    }

    return null;
  };

  return (
    <div id={id} className={`inline-flex items-center gap-3 ${className}`}>
      {renderImage()}
      {showName && channel && (
        <span className="font-sans font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">
          {getProviderIdentity(channel?.provider_id || channel?.provider_code || channel?.providerCode || channel?.id || (typeof channel === 'string' ? channel : '')).display_name}
        </span>
      )}
    </div>
  );
}

/* ==========================================================================
   PROVIDER BRAND BLOCK
   ========================================================================== */
interface ProviderBrandBlockProps {
  channel: any;
  transferMethod?: string;
  surface?: BrandSurface;
  showVerification?: boolean;
  showWebsiteLink?: boolean;
  className?: string;
  id?: string;
}

export function ProviderBrandBlock({
  channel,
  transferMethod,
  surface = 'light',
  showVerification = true,
  showWebsiteLink = false,
  className = '',
  id
}: ProviderBrandBlockProps) {
  if (!channel) return null;

  const resolved = getProviderBranding(channel, surface);
  const identity = getProviderIdentity(channel?.provider_id || channel?.provider_code || channel?.providerCode || channel?.id || (typeof channel === 'string' ? channel : ''));
  const displayName = identity.display_name;
  const method = transferMethod || channel.transferMethod || channel.type || 'Bank Transfer';
  const website = channel.website || channel.metadata?.website;

  return (
    <div id={id} className={`flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 ${className}`}>
      <div className="flex items-center gap-3">
        <ProviderLogo
          channel={channel}
          size="md"
          surface={surface}
          shape="rounded"
          showFallback={true}
        />
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-sans font-black text-slate-850 dark:text-slate-100 text-xs uppercase tracking-wide">
              {displayName}
            </span>
            {showVerification && resolved.approvalStatus === 'official' && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10 shrink-0" title="Official Verified Partner" />
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            {method}
          </span>
        </div>
      </div>

      {showWebsiteLink && website && (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-350 p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-all"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

/* ==========================================================================
   COUNTRY FLAG COMPONENT
   ========================================================================== */
interface CountryFlagProps {
  country: string;
  currency?: string;
  flagAssetId?: string;
  size?: BrandAssetSize;
  className?: string;
  id?: string;
}

export function CountryFlag({
  country,
  currency,
  flagAssetId,
  size = 'sm',
  className = '',
  id
}: CountryFlagProps) {
  const resolved = getCountryFlag(country, currency, flagAssetId);
  const [imgState, setImgState] = useState<'loading' | 'success' | 'error'>(resolved.url ? 'loading' : 'error');

  useEffect(() => {
    if (resolved.url) {
      setImgState('loading');
    } else {
      setImgState('error');
    }
  }, [resolved.url]);

  const sizeClass = SDS_ASSET_SIZES[size] || SDS_ASSET_SIZES.sm;

  if (resolved.url && imgState !== 'error') {
    return (
      <div id={id} className={`relative shrink-0 flex items-center justify-center ${className}`}>
        {imgState === 'loading' && <AssetSkeleton size={size} shape="rounded" />}
        <img
          src={resolved.url}
          alt={resolved.altText}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setImgState('success')}
          onError={() => setImgState('error')}
          className={`${sizeClass} rounded-md object-cover border border-slate-150 transition-all ${imgState === 'loading' ? 'hidden' : 'block'}`}
        />
      </div>
    );
  }

  // Get country flag emoji fallback
  const getFlagEmoji = (cName: string) => {
    switch (cName?.toLowerCase()) {
      case 'kenya': return '🇰🇪';
      case 'philippines': return '🇵🇭';
      case 'india': return '🇮🇳';
      case 'pakistan': return '🇵🇰';
      case 'egypt': return '🇪🇬';
      case 'saudi arabia': return '🇸🇦';
      case 'bangladesh': return '🇧🇩';
      case 'nepal': return '🇳🇵';
      case 'sri lanka': return '🇱🇰';
      default: return '🏳️';
    }
  };

  const emoji = getFlagEmoji(country);

  return (
    <div id={id} className={`flex items-center justify-center font-sans text-lg shrink-0 select-none ${className}`} title={country}>
      <span>{emoji}</span>
    </div>
  );
}

/* ==========================================================================
   CORRIDOR IDENTITY
   ========================================================================== */
interface CorridorIdentityProps {
  country: string;
  currency: string;
  flagAssetId?: string;
  size?: BrandAssetSize;
  className?: string;
  id?: string;
}

export function CorridorIdentity({
  country,
  currency,
  flagAssetId,
  size = 'sm',
  className = '',
  id
}: CorridorIdentityProps) {
  return (
    <div id={id} className={`inline-flex items-center gap-2 ${className}`}>
      <CountryFlag
        country={country}
        currency={currency}
        flagAssetId={flagAssetId}
        size={size}
      />
      <div className="flex flex-col text-left">
        <span className="font-sans font-black text-slate-800 dark:text-slate-100 text-xs tracking-tight leading-none uppercase">
          {country}
        </span>
        <span className="text-[9px] text-slate-400 font-mono font-bold tracking-wider mt-0.5 uppercase">
          {currency}
        </span>
      </div>
    </div>
  );
}

/* ==========================================================================
   BRAND BADGE SYSTEM
   ========================================================================== */
interface BrandBadgeProps {
  type: string;
  label: string;
  size?: BrandAssetSize;
  className?: string;
  id?: string;
}

export function BrandBadge({
  type,
  label,
  size = 'sm',
  className = '',
  id
}: BrandBadgeProps) {
  const resolved = getBadgeAsset(type);
  const [imgState, setImgState] = useState<'loading' | 'success' | 'error'>(resolved.url ? 'loading' : 'error');

  useEffect(() => {
    if (resolved.url) {
      setImgState('loading');
    } else {
      setImgState('error');
    }
  }, [resolved.url]);

  // If BAM image badge exists
  if (resolved.url && imgState !== 'error') {
    return (
      <span id={id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-150 shrink-0 ${className}`}>
        <img
          src={resolved.url}
          alt={resolved.altText}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setImgState('success')}
          onError={() => setImgState('error')}
          className="w-3.5 h-3.5 object-contain"
        />
        <span>{label}</span>
      </span>
    );
  }

  // Fallback to SDS icon classes
  const getBadgeIcon = (t: string) => {
    switch (t?.toLowerCase()) {
      case 'verified': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'recommended': return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
      case 'official': return <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />;
      default: return <Info className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <span id={id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-100 bg-slate-50 text-slate-700 select-none ${className}`}>
      {getBadgeIcon(type)}
      <span>{label}</span>
    </span>
  );
}

/* ==========================================================================
   ACHIEVEMENT ICON COMPONENT
   ========================================================================== */
interface AchievementIconProps {
  achievement: any;
  size?: BrandAssetSize;
  className?: string;
  id?: string;
}

export function AchievementIcon({
  achievement,
  size = 'md',
  className = '',
  id
}: AchievementIconProps) {
  const resolved = getAchievementIcon(achievement);
  const [imgState, setImgState] = useState<'loading' | 'success' | 'error'>(resolved.url ? 'loading' : 'error');

  useEffect(() => {
    if (resolved.url) {
      setImgState('loading');
    } else {
      setImgState('error');
    }
  }, [resolved.url]);

  const sizeClass = SDS_ASSET_SIZES[size] || SDS_ASSET_SIZES.md;

  if (resolved.url && imgState !== 'error') {
    return (
      <div id={id} className={`relative shrink-0 flex items-center justify-center p-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 rounded-xl ${className}`}>
        {imgState === 'loading' && <AssetSkeleton size={size} shape="circle" />}
        <img
          src={resolved.url}
          alt={resolved.altText}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setImgState('success')}
          onError={() => setImgState('error')}
          className={`${sizeClass} rounded-full object-contain`}
        />
      </div>
    );
  }

  // Fallback to beautiful Trophy icon
  const fallbackColor = resolved.primaryColor || '#F59E0B';

  return (
    <div 
      id={id} 
      className={`flex items-center justify-center bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 rounded-xl shrink-0 p-2.5 ${className}`}
      style={{ color: fallbackColor }}
    >
      <Trophy className="w-5 h-5 animate-pulse" />
    </div>
  );
}

/* ==========================================================================
   NOTIFICATION BRAND ICON
   ========================================================================== */
interface NotificationBrandIconProps {
  notification: any;
  size?: BrandAssetSize;
  className?: string;
  id?: string;
}

export function NotificationBrandIcon({
  notification,
  size = 'sm',
  className = '',
  id
}: NotificationBrandIconProps) {
  const resolved = resolveNotificationAsset(notification);
  const [imgState, setImgState] = useState<'loading' | 'success' | 'error'>(resolved.url ? 'loading' : 'error');

  useEffect(() => {
    if (resolved.url) {
      setImgState('loading');
    } else {
      setImgState('error');
    }
  }, [resolved.url]);

  const sizeClass = SDS_ASSET_SIZES[size] || SDS_ASSET_SIZES.sm;

  if (resolved.url && imgState !== 'error') {
    return (
      <div id={id} className={`relative shrink-0 flex items-center justify-center ${className}`}>
        {imgState === 'loading' && <AssetSkeleton size={size} shape="circle" />}
        <img
          src={resolved.url}
          alt={resolved.altText}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setImgState('success')}
          onError={() => setImgState('error')}
          className={`${sizeClass} rounded-full border border-slate-100 object-contain`}
        />
      </div>
    );
  }

  // Fallback to standard context-aware notification icons
  const getContextIcon = () => {
    const type = notification?.type || notification?.category || '';
    switch (type) {
      case 'transfer':
      case 'transaction':
        return <UserCheck className="w-4 h-4 text-emerald-500" />;
      case 'rate_alert':
      case 'rate':
        return <Globe className="w-4 h-4 text-indigo-500" />;
      case 'achievement':
      case 'seps':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div id={id} className={`flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-xl p-2 shrink-0 ${className}`}>
      {getContextIcon()}
    </div>
  );
}

/* ==========================================================================
   PARTNER LOGO COMPONENT
   ========================================================================== */
interface PartnerLogoProps {
  partnerKey: string;
  size?: BrandAssetSize;
  className?: string;
  id?: string;
}

export function PartnerLogo({
  partnerKey,
  size = 'md',
  className = '',
  id
}: PartnerLogoProps) {
  const resolved = getPartnerLogo(partnerKey);
  const [imgState, setImgState] = useState<'loading' | 'success' | 'error'>(resolved.url ? 'loading' : 'error');

  useEffect(() => {
    if (resolved.url) {
      setImgState('loading');
    } else {
      setImgState('error');
    }
  }, [resolved.url]);

  const sizeClass = SDS_ASSET_SIZES[size] || SDS_ASSET_SIZES.md;

  if (resolved.url && imgState !== 'error') {
    return (
      <div id={id} className={`relative shrink-0 flex items-center justify-center ${className}`}>
        {imgState === 'loading' && <AssetSkeleton size={size} shape="rounded" />}
        <img
          src={resolved.url}
          alt={resolved.altText}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setImgState('success')}
          onError={() => setImgState('error')}
          className={`${sizeClass} rounded-lg object-contain bg-white p-1`}
        />
      </div>
    );
  }

  return (
    <AssetFallback
      initials={resolved.fallbackInitials || 'PT'}
      size={size}
      shape="rounded"
      bgColor="#4F46E5"
    />
  );
}

/* ==========================================================================
   BRAND ILLUSTRATION COMPONENT
   ========================================================================== */
interface BrandIllustrationProps {
  type: 'expat' | 'savings' | 'trust' | 'community' | 'shield' | string;
  className?: string;
  id?: string;
}

export function BrandIllustration({
  type,
  className = '',
  id
}: BrandIllustrationProps) {
  const resolved = getIllustration(type);
  const [imgState, setImgState] = useState<'loading' | 'success' | 'error'>(resolved.url ? 'loading' : 'error');

  useEffect(() => {
    if (resolved.url) {
      setImgState('loading');
    } else {
      setImgState('error');
    }
  }, [resolved.url]);

  if (resolved.url && imgState !== 'error') {
    return (
      <div id={id} className={`relative flex items-center justify-center ${className}`}>
        {imgState === 'loading' && <div className="w-full h-32 bg-slate-100 animate-pulse rounded-2xl" />}
        <img
          src={resolved.url}
          alt={resolved.altText}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setImgState('success')}
          onError={() => setImgState('error')}
          className={`w-full max-h-[150px] object-contain transition-all duration-350 ${imgState === 'loading' ? 'opacity-0' : 'opacity-100'}`}
        />
      </div>
    );
  }

  // Fallback to high contrast beautifully rendered inline vectors matching SDS Style
  if (type === 'expat') {
    return (
      <div id={id} className={`w-full max-w-[200px] mx-auto ${className}`}>
        <svg viewBox="0 0 200 150" fill="none" className="w-full h-auto">
          <circle cx="100" cy="75" r="50" fill="#0B5D47" fillOpacity="0.06" />
          <path d="M40 120C80 100 120 100 160 120" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 5" />
          <path d="M60 80C90 40 120 40 140 70" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="80" r="10" fill="#10B981" />
          <circle cx="140" cy="70" r="14" fill="#F59E0B" />
          <g transform="translate(100, 30)">
            <path d="M0 -5 L1.5 -1.5 L5 -1.5 L2 -0.5 L3.5 3 L0 1 L-3.5 3 L-2 -0.5 L-5 -1.5 L-1.5 -1.5 Z" fill="#F59E0B" />
          </g>
        </svg>
      </div>
    );
  }

  if (type === 'savings') {
    return (
      <div id={id} className={`w-full max-w-[200px] mx-auto ${className}`}>
        <svg viewBox="0 0 200 150" fill="none" className="w-full h-auto">
          <circle cx="100" cy="75" r="45" fill="#10B981" fillOpacity="0.06" />
          <rect x="70" y="50" width="60" height="50" rx="10" fill="white" stroke="#10B981" strokeWidth="3.5" />
          <circle cx="100" cy="75" r="10" fill="#F8FAFC" stroke="#F59E0B" strokeWidth="2.5" />
          <line x1="100" y1="65" x2="100" y2="85" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="90" y1="75" x2="110" y2="75" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (type === 'trust') {
    return (
      <div id={id} className={`w-full max-w-[200px] mx-auto ${className}`}>
        <svg viewBox="0 0 200 150" fill="none" className="w-full h-auto">
          <circle cx="100" cy="75" r="50" fill="#10B981" fillOpacity="0.06" />
          <path d="M100 35L145 55V95C145 120 125 138 100 145C75 138 55 120 55 95V55L100 35Z" fill="white" stroke="#10B981" strokeWidth="3" />
          <path d="M80 85L95 100L125 70" stroke="#10B981" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  // standard shield/general fallback
  return (
    <div id={id} className={`w-full max-w-[200px] mx-auto ${className}`}>
      <svg viewBox="0 0 200 150" fill="none" className="w-full h-auto">
        <circle cx="100" cy="75" r="40" fill="#F59E0B" fillOpacity="0.06" />
        <rect x="75" y="45" width="50" height="60" rx="8" fill="white" stroke="#10B981" strokeWidth="2.5" />
        <circle cx="115" cy="90" r="10" fill="#10B981" />
        <path d="M111 90L114 93L119 87" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ==========================================================================
   LEGACY COMPATIBILITY LOGO WRAPPER
   ========================================================================== */
interface LegacyCompatibleProviderLogoProps {
  brandAsset: any;
  legacyUrl?: string;
  providerName: string;
  size?: BrandAssetSize;
  className?: string;
  id?: string;
}

export function LegacyCompatibleProviderLogo({
  brandAsset,
  legacyUrl,
  providerName,
  size = 'md',
  className = '',
  id
}: LegacyCompatibleProviderLogoProps) {
  // Create a pseudo-channel that conforms to standard component inputs
  const fakeChannel = {
    displayName: providerName,
    brand_asset: brandAsset,
    logo_url: legacyUrl
  };

  return (
    <ProviderLogo
      channel={fakeChannel}
      size={size}
      surface="light"
      shape="rounded"
      showName={false}
      showFallback={true}
      className={className}
      id={id}
    />
  );
}
