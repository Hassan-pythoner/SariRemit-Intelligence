import React from 'react';
import { 
  CheckCircle2, AlertTriangle, XCircle, Info, ShieldCheck, 
  Sparkles, RefreshCw, Star, Users, ArrowRight, ArrowLeft,
  ChevronRight, Calendar, Loader2
} from 'lucide-react';

/* ==========================================================================
   SDS DESIGN TOKENS & STYLE UTILITIES
   ========================================================================== */

// SDS Brand Color Constants for reference
export const SDS_COLORS = {
  primary: '#10B981',      // Premium Green
  secondary: '#F59E0B',    // Premium Gold
  bg: '#071A35',           // Deep Navy
  card: '#0C2547',         // Slightly lighter Navy
  bgSec: '#091F3E',        // Secondary lighter Navy
  text: '#F8FAFC',         // Off-white
  textSec: '#94A3B8',      // Slate text
  border: 'rgba(148, 163, 184, 0.12)', // Subtle borders
  success: '#10B981',      // Success Green
  warning: '#F59E0B',      // Warning Amber
  error: '#EF4444',        // Error Red
};

/* ==========================================================================
   SDS LOGO COMPONENT
   ========================================================================== */
interface SDSLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  tagline?: string;
}

export function SDSLogo({ className = '', size = 'md', withText = true, tagline }: SDSLogoProps) {
  const containerSizes = {
    sm: 'w-7 h-7 rounded-lg text-base',
    md: 'w-9 h-9 rounded-xl text-lg',
    lg: 'w-12 h-12 rounded-2xl text-2xl',
    xl: 'w-16 h-16 rounded-3xl text-3xl',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${containerSizes[size]} bg-sds-primary flex items-center justify-center font-black text-white shadow-sds-md relative shrink-0 transition-all hover:scale-105`}>
        <span>S</span>
        <span className="text-sds-secondary absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 w-1.5 h-1.5 bg-sds-secondary rounded-full animate-pulse"></span>
      </div>
      {withText && (
        <div className="flex flex-col text-left">
          <span className={`font-sans font-black tracking-tight text-sds-text ${textSizes[size]} leading-none`}>
            SariRemit
          </span>
          {tagline ? (
            <span className="text-[9px] text-sds-text-sec font-mono font-bold uppercase tracking-widest mt-0.5">
              {tagline}
            </span>
          ) : (
            <span className="text-[9px] text-sds-text-sec font-mono font-bold uppercase tracking-widest mt-0.5">
              SEND SMART. SAVE MORE.
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   SDS TYPOGRAPHY WRAPPERS
   ========================================================================== */
interface SDSTextProps {
  variant?: 'display' | 'heading' | 'subheading' | 'body' | 'caption' | 'label';
  className?: string;
  children: React.ReactNode;
  id?: string;
}

export function SDSText({ variant = 'body', className = '', children, id }: SDSTextProps) {
  const styles = {
    display: 'font-sans font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight text-sds-text leading-tight',
    heading: 'font-sans font-extrabold text-xl sm:text-2xl tracking-tight text-sds-text',
    subheading: 'font-sans font-bold text-base sm:text-lg tracking-tight text-sds-text-sec',
    body: 'font-sans text-sm text-sds-text-sec leading-relaxed',
    caption: 'font-mono text-xs text-sds-text-sec tracking-wide',
    label: 'font-sans font-bold text-xs uppercase tracking-wider text-sds-text-sec',
  };

  return (
    <div id={id} className={`${styles[variant]} ${className}`}>
      {children}
    </div>
  );
}

/* ==========================================================================
   SDS BUTTON SYSTEM
   ========================================================================== */
interface SDSButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
  id?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
}

export function SDSButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  loading = false,
  className = '',
  children,
  id,
  disabled,
  ...props
}: SDSButtonProps) {
  const baseStyle = 'inline-flex items-center justify-center font-bold tracking-wide rounded-2xl border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none min-h-[44px]';
  
  const variants = {
    primary: 'bg-sds-gold border-sds-gold text-slate-950 hover:bg-sds-gold/90 focus:ring-sds-gold/40 shadow-sds-sm font-black',
    secondary: 'bg-sds-bg-surface-soft border-sds-border text-sds-text hover:bg-sds-border/20 focus:ring-sds-gold/20',
    ghost: 'bg-transparent border-transparent text-sds-gold hover:bg-sds-bg-surface-soft focus:ring-sds-gold/20',
    danger: 'bg-rose-500/10 border-transparent text-rose-500 hover:bg-rose-500/20 focus:ring-rose-500/30',
    success: 'bg-sds-success border-sds-success text-white hover:bg-sds-success/90 focus:ring-sds-success/40 shadow-sds-sm',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs rounded-xl gap-1.5 min-h-[38px]',
    md: 'px-5 py-2.5 text-sm rounded-2xl gap-2 min-h-[44px]',
    lg: 'px-7 py-3.5 text-base rounded-2xl gap-2.5 min-h-[50px]',
  };

  return (
    <button
      id={id}
      className={`
        ${baseStyle} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {!loading && icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span className="font-sans font-extrabold">{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
}

/* ==========================================================================
   SDS CARD SYSTEM
   ========================================================================== */
interface SDSCardProps extends React.ComponentPropsWithoutRef<'div'> {
  hoverEffect?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'flat' | 'outline' | 'shadow';
  className?: string;
  children?: React.ReactNode;
  id?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  key?: string | number;
}

export function SDSCard({
  hoverEffect = false,
  padding = 'md',
  variant = 'shadow',
  className = '',
  children,
  id,
  ...props
}: SDSCardProps) {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8 lg:p-10',
  };

  const variants = {
    flat: 'bg-sds-bg-surface-soft border border-transparent',
    outline: 'bg-sds-card border border-sds-border',
    shadow: 'bg-sds-card border border-sds-border shadow-sds-md',
  };

  return (
    <div
      id={id}
      className={`
        rounded-[20px] 
        ${variants[variant]} 
        ${paddings[padding]} 
        ${hoverEffect ? 'hover:shadow-sds-lg hover:border-sds-primary/30 transition-all duration-300 transform hover:-translate-y-0.5' : ''} 
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

/* ==========================================================================
   SDS BADGE SYSTEM
   ========================================================================== */
export type SDSBadgeType =
  | 'recommended'
  | 'verified'
  | 'management-verified'
  | 'community-verified'
  | 'fresh'
  | 'stale'
  | 'market-reference'
  | 'admin-override'
  | 'sis-excellent'
  | 'sis-strong'
  | 'true-cost-low'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

interface SDSBadgeProps {
  type: SDSBadgeType;
  className?: string;
  id?: string;
}

export function SDSBadge({ type, className = '', id }: SDSBadgeProps) {
  const badges: Record<SDSBadgeType, { label: string; style: string; icon: React.ReactNode }> = {
    recommended: {
      label: 'Recommended',
      style: 'bg-sds-primary/10 text-sds-primary border-sds-primary/20',
      icon: <Sparkles className="w-3 h-3" />
    },
    verified: {
      label: 'Verified',
      style: 'bg-sds-success/10 text-sds-success border-sds-success/20',
      icon: <CheckCircle2 className="w-3 h-3" />
    },
    'management-verified': {
      label: 'Mgmt Verified',
      style: 'bg-sds-primary/10 text-sds-primary border-sds-primary/30 font-black',
      icon: <ShieldCheck className="w-3 h-3 text-sds-primary" />
    },
    'community-verified': {
      label: 'Community Verified',
      style: 'bg-sds-secondary/10 text-[#c08600] border-sds-secondary/20',
      icon: <Users className="w-3 h-3" />
    },
    fresh: {
      label: 'Fresh',
      style: 'bg-sds-success/10 text-sds-success border-sds-success/20',
      icon: <span className="w-1.5 h-1.5 rounded-full bg-sds-success animate-ping" />
    },
    stale: {
      label: 'Stale',
      style: 'bg-[#D94B4B]/10 text-[#D94B4B] border-[#D94B4B]/20',
      icon: <AlertTriangle className="w-3 h-3" />
    },
    'market-reference': {
      label: 'Market Reference',
      style: 'bg-sds-bg-sec text-sds-text border-sds-border',
      icon: <Info className="w-3 h-3 text-sds-text-sec" />
    },
    'admin-override': {
      label: 'Admin Override',
      style: 'bg-[#F0A500]/10 text-[#c08600] border-[#F0A500]/20 font-black uppercase tracking-wider text-[9px]',
      icon: <ShieldCheck className="w-3 h-3 text-[#F0A500]" />
    },
    'sis-excellent': {
      label: 'SIS Excellent',
      style: 'bg-sds-primary text-white border-sds-primary font-black shadow-sds-sm',
      icon: <Star className="w-3 h-3 text-sds-secondary fill-current animate-pulse" />
    },
    'sis-strong': {
      label: 'SIS Strong',
      style: 'bg-sds-primary/10 text-sds-primary border-sds-primary/30',
      icon: <Star className="w-3 h-3 text-sds-primary" />
    },
    'true-cost-low': {
      label: 'True Cost Low',
      style: 'bg-sds-success/15 text-sds-success border-sds-success/35 font-extrabold',
      icon: <Sparkles className="w-3 h-3 text-sds-success" />
    },
    success: {
      label: 'Success',
      style: 'bg-sds-success/10 text-sds-success border-sds-success/20',
      icon: <CheckCircle2 className="w-3 h-3" />
    },
    warning: {
      label: 'Warning',
      style: 'bg-[#F0A500]/10 text-[#c08600] border-[#F0A500]/20',
      icon: <AlertTriangle className="w-3 h-3" />
    },
    error: {
      label: 'Error',
      style: 'bg-[#D94B4B]/10 text-[#D94B4B] border-[#D94B4B]/20',
      icon: <XCircle className="w-3 h-3" />
    },
    info: {
      label: 'Info',
      style: 'bg-sds-bg-sec text-sds-text-sec border-sds-border',
      icon: <Info className="w-3 h-3" />
    }
  };

  const currentBadge = badges[type] || badges.info;

  return (
    <span
      id={id}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 font-sans select-none
        ${currentBadge.style} 
        ${className}
      `}
    >
      {currentBadge.icon}
      <span>{currentBadge.label}</span>
    </span>
  );
}

/* ==========================================================================
   SDS FORM SYSTEM CONTROLS
   ========================================================================== */
interface SDSInputProps extends React.ComponentPropsWithoutRef<'input'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  hint?: string;
  id?: string;
  className?: string;
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  maxLength?: number;
}

export function SDSInput({
  label,
  error,
  icon,
  hint,
  className = '',
  id,
  ...props
}: SDSInputProps) {
  return (
    <div className={`space-y-1.5 w-full text-left`}>
      {label && (
        <label className="block text-xs font-black text-sds-text uppercase tracking-widest">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sds-text-sec flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`
            w-full px-4 py-3 min-h-[44px] bg-sds-bg-surface-soft border border-sds-border rounded-[14px] font-semibold font-sans text-base sm:text-sm text-sds-text placeholder:text-sds-text-muted
            focus:outline-none focus:ring-2 focus:ring-sds-primary/20 focus:border-sds-primary transition-all duration-200
            ${icon ? 'pl-11' : ''}
            ${error ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-rose-500 font-bold flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-[10px] text-sds-text-sec font-medium">{hint}</p>
      ) : null}
    </div>
  );
}

interface SDSSelectProps extends React.ComponentPropsWithoutRef<'select'> {
  label?: string;
  error?: string;
  hint?: string;
  id?: string;
  className?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

export function SDSSelect({
  label,
  error,
  hint,
  options,
  className = '',
  id,
  ...props
}: SDSSelectProps) {
  return (
    <div className={`space-y-1.5 w-full text-left`}>
      {label && (
        <label className="block text-xs font-black text-sds-text uppercase tracking-widest">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`
          w-full px-4 py-3 min-h-[44px] bg-sds-bg-surface-soft border border-sds-border rounded-[14px] font-semibold text-base sm:text-sm text-sds-text
          focus:outline-none focus:ring-2 focus:ring-sds-primary/20 focus:border-sds-primary cursor-pointer transition-all duration-200
          ${error ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled} className="font-semibold bg-sds-card text-sds-text">
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-rose-500 font-bold flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-[10px] text-sds-text-sec font-medium">{hint}</p>
      ) : null}
    </div>
  );
}

/* ==========================================================================
   SDS GAUGE COMPONENT (SariRemit Intelligence Score - SIS Gauge)
   ========================================================================== */
interface SDSSisGaugeProps {
  score: number; // 0 to 100
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
}

export function SDSSisGauge({ score, className = '', size = 'md', id }: SDSSisGaugeProps) {
  // Score ratings and color codes
  const getRating = (val: number) => {
    if (val >= 90) return { label: 'Excellent', color: 'text-sds-primary', bg: 'bg-sds-primary/10' };
    if (val >= 75) return { label: 'Strong', color: 'text-sds-success', bg: 'bg-sds-success/10' };
    if (val >= 60) return { label: 'Good', color: 'text-sds-warning', bg: 'bg-sds-warning/10' };
    return { label: 'Moderate', color: 'text-[#D94B4B]', bg: 'bg-[#D94B4B]/10' };
  };

  const rating = getRating(score);
  
  const dimensionSizes = {
    sm: { width: 100, radius: 40, strokeWidth: 8, fontSize: 'text-lg', labelSize: 'text-[9px]' },
    md: { width: 140, radius: 55, strokeWidth: 10, fontSize: 'text-2xl', labelSize: 'text-[10px]' },
    lg: { width: 180, radius: 70, strokeWidth: 12, fontSize: 'text-4xl', labelSize: 'text-xs' }
  };

  const config = dimensionSizes[size];
  const circumference = 2 * Math.PI * config.radius;
  // Semicircular indicator or full circular
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div id={id} className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: config.width, height: config.width }}>
        {/* SVG Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={config.radius}
            className="stroke-sds-border"
            strokeWidth={config.strokeWidth}
            fill="transparent"
          />
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={config.radius}
            className="stroke-sds-primary transition-all duration-1000 ease-out"
            strokeWidth={config.strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
        {/* Core Percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`font-mono font-black ${config.fontSize} text-sds-text`}>
            {score}
          </span>
          <span className={`font-sans font-black uppercase tracking-widest text-[9px] text-sds-primary`}>
            SIS Rating
          </span>
        </div>
      </div>
      <div className={`mt-2.5 px-3 py-1 rounded-full ${rating.bg} ${rating.color} text-xs font-black border border-current/10 uppercase tracking-wider`}>
        {rating.label}
      </div>
    </div>
  );
}

/* ==========================================================================
   SDS TABLE SYSTEM
   ========================================================================== */
interface SDSTableProps<T> {
  columns: {
    key: keyof T | string;
    header: string;
    render?: (item: T) => React.ReactNode;
    align?: 'left' | 'right' | 'center';
  }[];
  data: T[];
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
  id?: string;
}

export function SDSTable<T>({
  columns,
  data,
  onRowClick,
  className = '',
  emptyMessage = 'No data available.',
  id,
}: SDSTableProps<T>) {
  return (
    <div id={id} className={`w-full overflow-hidden border border-sds-border rounded-2xl bg-sds-card shadow-sds-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sds-bg-sec border-b border-sds-border">
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`px-5 py-4 text-xs font-black uppercase tracking-wider text-sds-text-sec text-${col.align || 'left'}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sds-border">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-8 text-center text-sm text-sds-text-sec font-medium">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`
                    transition-colors group
                    ${onRowClick ? 'cursor-pointer hover:bg-sds-bg-sec' : 'hover:bg-sds-bg-sec/40'}
                  `}
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-5 py-4 text-sm font-semibold text-sds-text text-${col.align || 'left'}`}
                    >
                      {col.render ? col.render(item) : (item[col.key as keyof T] as unknown as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ==========================================================================
   SDS DIALOG SYSTEM (MODALS)
   ========================================================================== */
interface SDSDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  id?: string;
}

export function SDSDialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  id,
}: SDSDialogProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-5xl',
  };

  return (
    <div id={id} className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#092C26]/40 backdrop-blur-xs transition-opacity animate-fadeIn" 
        onClick={onClose}
      />
      
      {/* Container Card */}
      <div className={`
        relative w-full bg-sds-card rounded-3xl border border-sds-border shadow-sds-lg overflow-hidden z-10 
        transform transition-all scale-100 animate-slideUp
        ${sizes[size]}
      `}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-sds-border flex items-center justify-between">
          <h3 className="font-sans font-black text-lg text-sds-text tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-sds-bg-sec text-sds-text-sec hover:text-sds-text transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-sds-bg-sec border-t border-sds-border flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   SDS SKELETON / LOADING STATES
   ========================================================================== */
interface SDSSkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect';
  id?: string;
}

export function SDSSkeleton({ className = '', variant = 'rect', id }: SDSSkeletonProps) {
  const styles = {
    text: 'h-4 w-full rounded',
    circle: 'rounded-full shrink-0',
    rect: 'rounded-2xl',
  };

  return (
    <div
      id={id}
      className={`
        bg-sds-border/60 animate-pulse 
        ${styles[variant]} 
        ${className}
      `}
    />
  );
}

/* ==========================================================================
   SDS EMPTY STATE SYSTEM
   ========================================================================== */
interface SDSEmptyStateProps {
  title: string;
  description: string;
  actionButton?: React.ReactNode;
  icon?: React.ReactNode;
  id?: string;
}

export function SDSEmptyState({
  title,
  description,
  actionButton,
  icon,
  id,
}: SDSEmptyStateProps) {
  return (
    <div id={id} className="p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-4">
      <div className="w-16 h-16 bg-sds-bg-sec border border-sds-border text-sds-primary rounded-2xl flex items-center justify-center shadow-sds-sm">
        {icon || <AlertTriangle className="w-8 h-8" />}
      </div>
      <div className="space-y-1.5">
        <h4 className="font-sans font-black text-base text-sds-text tracking-tight">
          {title}
        </h4>
        <p className="text-sm text-sds-text-sec font-medium leading-relaxed">
          {description}
        </p>
      </div>
      {actionButton && <div className="pt-2">{actionButton}</div>}
    </div>
  );
}

/* ==========================================================================
   SDS PREMIUM ILLUSTRATION COMPONENT
   ========================================================================== */
interface SDSIllustrationProps {
  type: 'expat' | 'savings' | 'trust' | 'community' | 'shield';
  className?: string;
}

export function SDSIllustration({ type, className = '' }: SDSIllustrationProps) {
  if (type === 'expat') {
    return (
      <svg className={`w-full h-auto ${className}`} viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Expat / Family Movement representation using SDS Colors */}
        <circle cx="100" cy="75" r="50" fill="#0B5D47" fillOpacity="0.06" />
        <circle cx="140" cy="95" r="30" fill="#F4B000" fillOpacity="0.1" />
        
        {/* Stylized Earth curve */}
        <path d="M40 120C80 100 120 100 160 120" stroke="#0B5D47" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 6" />
        
        {/* Dynamic Curved Flow (remittance route) */}
        <path d="M60 80C90 40 120 40 140 70" stroke="#0B5D47" strokeWidth="4" strokeLinecap="round" />
        <path d="M140 70L132 64M140 70L134 76" stroke="#0B5D47" strokeWidth="3" strokeLinecap="round" />
        
        {/* Family/User nodes */}
        <circle cx="60" cy="80" r="12" fill="#0B5D47" />
        <path d="M56 83C56 81.5 58 80 60 80C62 80 64 81.5 64 83" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="60" cy="76" r="3" fill="white" />
        
        <circle cx="140" cy="70" r="16" fill="#F4B000" />
        <path d="M135 74C135 72 138 70 140 70C142 70 145 72 145 74" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="140" cy="65" r="4" fill="white" />
        
        {/* Floating Stars representing trust and confidence */}
        <g transform="translate(100, 30)">
          <path d="M0 -6 L1.5 -2 L5.5 -2 L2 -0.5 L3.5 3.5 L0 1.5 L-3.5 3.5 L-2 -0.5 L-5.5 -2 L-1.5 -2 Z" fill="#F4B000" />
        </g>
        <g transform="translate(160, 45) scale(0.6)">
          <path d="M0 -6 L1.5 -2 L5.5 -2 L2 -0.5 L3.5 3.5 L0 1.5 L-3.5 3.5 L-2 -0.5 L-5.5 -2 L-1.5 -2 Z" fill="#F4B000" />
        </g>
      </svg>
    );
  }

  if (type === 'savings') {
    return (
      <svg className={`w-full h-auto ${className}`} viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="75" r="45" fill="#22A06B" fillOpacity="0.06" />
        {/* Money movement / vault illustration */}
        <rect x="70" y="50" width="60" height="50" rx="12" fill="white" stroke="#0B5D47" strokeWidth="4" />
        <circle cx="100" cy="75" r="12" fill="#FAFAF8" stroke="#F4B000" strokeWidth="3" />
        <line x1="100" y1="63" x2="100" y2="87" stroke="#F4B000" strokeWidth="3" strokeLinecap="round" />
        <line x1="88" y1="75" x2="112" y2="75" stroke="#F4B000" strokeWidth="3" strokeLinecap="round" />
        
        {/* Bar/Upwards Arrow indicating growth and savings */}
        <path d="M50 120L75 95L95 105L145 55" stroke="#22A06B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M145 55H133M145 55V67" stroke="#22A06B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        
        <circle cx="50" cy="120" r="4" fill="#22A06B" />
        <circle cx="75" cy="95" r="4" fill="#22A06B" />
        <circle cx="95" cy="105" r="4" fill="#22A06B" />
        <circle cx="145" cy="55" r="6" fill="#F4B000" />
      </svg>
    );
  }

  if (type === 'trust') {
    return (
      <svg className={`w-full h-auto ${className}`} viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="75" r="50" fill="#0B5D47" fillOpacity="0.06" />
        <path d="M100 35L145 55V95C145 120 125 138 100 145C75 138 55 120 55 95V55L100 35Z" fill="white" stroke="#0B5D47" strokeWidth="4" strokeLinejoin="round" />
        {/* Handshake or checkmark */}
        <path d="M80 85L95 100L125 70" stroke="#22A06B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="100" cy="48" r="4" fill="#F4B000" />
        <circle cx="140" cy="105" r="10" fill="#F4B000" fillOpacity="0.1" />
      </svg>
    );
  }

  // default/shield
  return (
    <svg className={`w-full h-auto ${className}`} viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="75" r="40" fill="#F4B000" fillOpacity="0.08" />
      <rect x="75" y="45" width="50" height="60" rx="8" fill="white" stroke="#0B5D47" strokeWidth="3" />
      <path d="M85 60H115M85 75H115M85 90H105" stroke="#E7EBE7" strokeWidth="3" strokeLinecap="round" />
      <circle cx="115" cy="90" r="10" fill="#22A06B" />
      <path d="M111 90L114 93L119 87" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
