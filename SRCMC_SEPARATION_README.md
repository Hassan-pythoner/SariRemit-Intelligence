# SRCMC Separation Guide & Export Manifest

This document serves as the implementation guide for migrating the **Saudi Arabian Remittance Intelligence and Corridor Management Centre (SRCMC)** platform out of the integrated **SariRemit** consumer-facing workspace and into a dedicated, sovereign administrative workspace inside **Google AI Studio**.

---

## 1. WHY SEPARATE?

The current application contains a dual-architecture:
1. **SariRemit (Client Portal)**: For expats in Saudi Arabia to view real-time rates, calculate transfer savings, record transfers, and log community submissions.
2. **SRCMC (Regulatory Control Center)**: For administrative operators to override rates, audit community records, approve official logos via the Brand Asset Manager (BAM), update weighted score algorithms, and inspect platform fraud logs.

Separating these concerns into two distinct AI Studio projects ensures:
- **Enhanced Security**: Isolation of sensitive administrative controls and database credentials.
- **Dedicated Workspaces**: Individual environments for consumer-focused optimization and administrative intelligence scaling.
- **Independent Scaling**: Easier continuous deployment pipeline for the regulatory platform.

---

## 2. THE ZIP EXPORT PROCESS IN AI STUDIO

To download your project files and configure them for the separated project, follow these steps:

1. Click on the **Settings (Gear Icon)** in the top right or sidebar navigation of your AI Studio interface.
2. Find the **Export Project** section.
3. Select **Export as ZIP Archive**. This will download the entire workspace including our newly created export manifests.
4. Extract the ZIP locally to inspect the files, or upload it directly into your new dedicated AI Studio repository.

---

## 3. CORRESPONDING DIRECTORY & FILE SCHEMATIC

Your separated SRCMC workspace will revolve around these core files:

```
SRCMC Project Root
├── .env.example                     <-- Environment Template for Supabase/Gemini
├── index.html                       <-- Application Entry Template
├── supabase-schema.sql              <-- PostgreSQL Tables & Constraints
├── srcmc-export-manifest.json       <-- Machine-readable migration structure
│
├── src
│   ├── main.tsx                     <-- React boostrapper
│   ├── App.tsx                      <-- Root Router serving the SRCMC Control Interface
│   ├── types.ts                     <-- Core typings (BAM, Evidence, SIS)
│   ├── index.css                    <-- Tailwind styling & SDS Variables
│   │
│   ├── components
│   │   ├── SrcmcControl.tsx         <-- MAIN administrative Dashboard & UI Center
│   │   ├── SdsBamComponents.tsx     <-- Standard SDS/BAM Presentation Components
│   │   └── Navigation.tsx           <-- Navigation Bar with security scopes
│   │
│   └── services
│       ├── supabaseService.ts       <-- Primary Database transactions Broker
│       ├── bamAssetResolver.ts      <-- Brand Asset Resolver with official fallbacks
│       ├── notificationService.ts   <-- Administrator alerts broadcaster
│       │
│       └── sic                      <-- Remittance Intelligence Engines (SIC)
│           ├── sisIntelligenceService.ts <-- Scoring logic & dynamic weights
│           ├── evidenceResolutionService.ts <-- Screenshot matching & screenshot hashing
│           └── evidenceProvenanceService.ts <-- Multi-tier audit verification logs
```

---

## 4. DATABASE INITIALIZATION (SUPABASE)

To configure the Supabase backend for the independent SRCMC project, use the SQL file provided:

1. Open your **Supabase Dashboard** for the new project.
2. Navigate to the **SQL Editor**.
3. Create a **New Query**.
4. Paste the contents of `supabase-schema.sql` located at the root of this ZIP.
5. Click **Run** to provision the entire relational structure (including tables, Foreign Key constraints, Row Level Security, and trigger functions).

---

## 5. RE-CONFIGURING ENVIRONMENT VARIABLES

In your new AI Studio project, navigate to the **Secrets / Env** section and register these credentials:

- `VITE_SUPABASE_URL`: Your Supabase API endpoint.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase client anonymous token.
- `GEMINI_API_KEY`: Google Gemini secret key to power screenshot analysis, suspicious activity detection, and automated audit checks.

---

## 6. READY FOR MIGRATION

Your export files are fully verified, prepared, and compiled. You are ready to click **Export as ZIP Archive** and launch the next generation of the **Saudi Arabian Remittance Intelligence and Corridor Management Centre (SRCMC)**!
