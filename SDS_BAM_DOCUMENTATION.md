# SariRemit Design System (SDS) — Brand Asset Manager (BAM) Documentation

Welcome to the **SariRemit Design System (SDS) with integrated Brand Asset Manager (BAM)** documentation. This guide details how to consume brand assets securely, accessibly, and performantly across all SariRemit platform screens.

---

## 1. UPDATED SDS ARCHITECTURE

The SariRemit Design System is structured as a unified presentation layer where BAM serves as the source of truth for assets, and SDS governs how those assets are styled and displayed.

```
SariRemit Design System — SDS
├── Brand Asset Manager — BAM
│   ├── Asset Resolver
│   ├── Asset Registry
│   ├── Provider Branding
│   ├── SariRemit Branding
│   ├── Country and Corridor Assets
│   ├── Badges
│   ├── Achievement Icons
│   ├── Illustrations
│   └── Partner Assets
│
├── Design Tokens
├── Component Library
├── Typography
├── Layout System
├── Motion System
├── Responsive System
├── Accessibility Standards
└── Theme System
```

---

## 2. STRICT ARCHITECTURAL RULE

> ⚠️ **CRITICAL DEVELOPMENT RULE:**
> **No new user-facing component may import provider, partner, country, badge, or SariRemit branding files directly when a BAM asset type exists.** 
> Always consume assets via the unified SDS brand components or the shared `bamAssetResolver` service.

---

## 3. UNIFIED RESOLUTION SERVICE

Do not query the `brand_assets` database table directly from UI pages. Instead, import resolution helpers from `@/services/bamAssetResolver`.

### Standard API:
- `getBrandAsset(id)`: Find a brand asset by its database UUID.
- `getSariRemitLogo(surface, size)`: Fetch the company logo compatible with the background.
- `getSariRemitMonogram(surface, size)`: Fetch the company monogram.
- `getProviderBranding(channel, surface)`: Resolve priority-ordered provider assets.
- `getCountryFlag(country, currency, flagAssetId)`: Resolve flags safely.
- `getCorridorIcon(corridor)`: Resolve country-to-country corridor symbols.
- `getBadgeAsset(type)`: Resolve BAM image badge URLs.
- `getAchievementIcon(achievement)`: Resolve SEPS achievement badges.
- `getIllustration(type)`: Resolve onboarding or status illustrations.
- `getPartnerLogo(partnerKey)`: Resolve third-party partner emblems.
- `resolveAssetVariant(asset, surface)`: Handle light/dark variant resolution.
- `resolveNotificationAsset(notification)`: Resolve standard notification alerts.

---

## 4. PROVIDER BRANDING PRIORITY ORDER

The resolution layer automatically enforces the official brand fallback sequence to prevent layout shifts or broken image indicators:

1. **Active Official BAM Asset** (Verified & Approved)
2. **Active Placeholder BAM Asset** (Safe administration substitute)
3. **Active Legacy `logo_url`** (Backward-compatible migration url)
4. **SDS Provider Initials** (Procedural CSS container with calculated brand hue)

---

## 5. REUSABLE BRAND COMPONENTS

All components are fully interactive, accessible, lazy-loaded, responsive, and support theme-aware surfaces.

### A. `<SariRemitLogo />`
Official corporate logo.
```tsx
import { SariRemitLogo } from '@/components/SdsBamComponents';

// Variants: 'primary' | 'monogram' | 'wordmark' | 'logo_with_slogan' | 'light' | 'dark' | 'compact' | 'favicon-style'
<SariRemitLogo 
  variant="logo_with_slogan" 
  surface="dark" 
  size="lg" 
/>
```

### B. `<ProviderLogo />`
Renders safe, verified provider logos with instant fail-safe to legacy urls and brand-colored initials.
```tsx
import { ProviderLogo } from '@/components/SdsBamComponents';

<ProviderLogo 
  channel={channel} 
  size="md" 
  surface="light" 
  shape="rounded" // 'square' | 'rounded' | 'circle' | 'natural'
  showName={false} 
/>
```

### C. `<ProviderBrandBlock />`
Rich information layout showing provider status, verified badge, and contact links (for SRCMC).
```tsx
import { ProviderBrandBlock } from '@/components/SdsBamComponents';

<ProviderBrandBlock 
  channel={channel} 
  transferMethod="Instant Cash" 
  surface="light" 
  showVerification={true} 
/>
```

### D. `<CountryFlag />` & `<CorridorIdentity />`
High performance flags fallback to standard emojis when BAM asset does not exist.
```tsx
import { CorridorIdentity } from '@/components/SdsBamComponents';

<CorridorIdentity 
  country="Kenya" 
  currency="KES" 
  size="sm" 
/>
```

### E. `<BrandBadge />`
Enforces standard token-based badge indicators or retrieves dynamic BAM media emblems.
```tsx
import { BrandBadge } from '@/components/SdsBamComponents';

<BrandBadge 
  type="verified" 
  label="Verified Rate" 
/>
```

### F. `<AchievementIcon />`
Directly connects SEPS user achievements to official BAM badge designs.
```tsx
import { AchievementIcon } from '@/components/SdsBamComponents';

<AchievementIcon 
  achievement={userAchievement} 
  size="md" 
/>
```

### G. `<BrandIllustration />`
Standardized vector drawings or BAM-managed graphics for empty states, loaders, and confirmations.
```tsx
import { BrandIllustration } from '@/components/SdsBamComponents';

<BrandIllustration type="savings" />
```

---

## 6. DESIGN TOKENS & SIZING

We enforce unified asset dimensions in pixels:
- `xs` (20px) — Compact listings and mini indicators.
- `sm` (28px) — Main list view metadata and corridor flags.
- `md` (40px) — Recommended card icons, sidebar menus.
- `lg` (56px) — Provider details header logos.
- `xl` (80px) — Onboarding avatars and profile achievements.

---

## 7. ACCESSIBILITY & SECURITY

- **Alt-Text Enforcement**: All components generate descriptive, human-readable labels (e.g., `"Western Union official brand logo"`). Decorative graphics use empty alt tags `alt=""`.
- **Contrast Ratios**: Fallback text badges satisfy WCAG 2.1 AA contrast rules.
- **Security Scoping**: Public components do not expose restricted permissions, internal notes, or administrative metadata to normal users.
