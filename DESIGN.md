---
name: AURA Unified Design System
version: 2.0.0
experiences:
  worker: Frontline Industrial Voice Instrument
  supervisor: Supervisor Safety Cockpit
colors:
  # Surface & Foundation Canvas
  surface: '#FFFFFF'
  surface-dim: '#d0dbe7'
  surface-bright: '#f6faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ebf5ff'
  surface-container: '#e4effb'
  surface-container-high: '#deeaf5'
  surface-container-highest: '#d8e4ef'
  background: '#f6faff'
  app-background: '#EFF3F6'
  secondary-surface: '#D6E8EA'
  border-structural: '#D0DCE5'
  outline: '#6e7978'
  outline-variant: '#bdc9c7'

  # Inks & Contrast Architecture (11:1+ WCAG AAA)
  ink-950: '#111C24'
  ink-900: '#1B2A33'
  ink-700: '#40515A'
  ink-500: '#6F7E85'
  on-surface: '#121d25'
  on-surface-variant: '#3e4948'
  inverse-surface: '#27323a'
  inverse-on-surface: '#e7f2fe'

  # Core Primary & Voice Brand Accents
  primary: '#005d5a'
  on-primary: '#ffffff'
  primary-container: '#0e7774'
  on-primary-container: '#a5fbf7'
  inverse-primary: '#7fd5d1'
  primary-fixed: '#9bf1ed'
  primary-fixed-dim: '#7fd5d1'
  on-primary-fixed: '#00201f'
  on-primary-fixed-variant: '#00504e'
  surface-tint: '#006a67'
  aura-teal: '#0E7774'
  aura-teal-dark: '#075B5A'
  aura-teal-light: '#E0F2F1'
  aura-teal-ring: '#0F766E'

  # Secondary & Tertiary Surfaces
  secondary: '#516163'
  on-secondary: '#ffffff'
  secondary-container: '#d4e6e8'
  on-secondary-container: '#576769'
  secondary-fixed: '#d4e6e8'
  secondary-fixed-dim: '#b8cacc'
  on-secondary-fixed: '#0e1e20'
  on-secondary-fixed-variant: '#394a4b'
  tertiary: '#45555f'
  on-tertiary: '#ffffff'
  tertiary-container: '#5d6d77'
  on-tertiary-container: '#deeffb'
  tertiary-fixed: '#d5e5f1'
  tertiary-fixed-dim: '#b9c9d5'
  on-tertiary-fixed: '#0e1d26'
  on-tertiary-fixed-variant: '#3a4952'

  # Semantic Safety Rails
  warning-amber: '#F0A51A'
  warning-bg: '#FEF7E0'
  danger-red: '#C9362B'
  danger-bg: '#FCE8E6'
  success-green: '#237A4B'
  success-green-light: '#E6F4EA'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'

typography:
  fontFamily: Atkinson Hyperlegible Next, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
  # Frontline Worker Scale
  worker:
    large-reading:
      fontSize: 36px
      fontWeight: '700'
      lineHeight: 42px
      letterSpacing: -0.01em
    state-display:
      fontSize: 32px
      fontWeight: '700'
      lineHeight: 38px
      letterSpacing: -0.01em
    screen-title:
      fontSize: 24px
      fontWeight: '700'
      lineHeight: 30px
      letterSpacing: 0em
    primary-text:
      fontSize: 22px
      fontWeight: '600'
      lineHeight: 30px
      letterSpacing: 0em
    body:
      fontSize: 18px
      fontWeight: '500'
      lineHeight: 26px
      letterSpacing: 0em
    metadata:
      fontSize: 16px
      fontWeight: '500'
      lineHeight: 22px
      letterSpacing: 0.01em
    label:
      fontSize: 14px
      fontWeight: '700'
      lineHeight: 18px
      letterSpacing: 0.08em
    state-display-mobile:
      fontSize: 28px
      fontWeight: '700'
      lineHeight: 34px
      letterSpacing: -0.01em
    large-reading-mobile:
      fontSize: 32px
      fontWeight: '700'
      lineHeight: 38px
      letterSpacing: -0.01em
  # Supervisor Cockpit Scale
  supervisor:
    headline-xl:
      fontSize: 36px
      fontWeight: '700'
      lineHeight: 42px
      letterSpacing: -0.01em
    headline-lg:
      fontSize: 28px
      fontWeight: '700'
      lineHeight: 34px
      letterSpacing: -0.01em
    headline-md:
      fontSize: 24px
      fontWeight: '700'
      lineHeight: 30px
      letterSpacing: 0em
    headline-sm:
      fontSize: 20px
      fontWeight: '600'
      lineHeight: 26px
      letterSpacing: 0em
    body-lg:
      fontSize: 18px
      fontWeight: '500'
      lineHeight: 26px
      letterSpacing: 0em
    body-md:
      fontSize: 16px
      fontWeight: '500'
      lineHeight: 24px
      letterSpacing: 0em
    body-sm:
      fontSize: 14px
      fontWeight: '500'
      lineHeight: 20px
      letterSpacing: 0.01em
    label-lg:
      fontSize: 14px
      fontWeight: '700'
      lineHeight: 18px
      letterSpacing: 0.08em
    label-md:
      fontSize: 12px
      fontWeight: '700'
      lineHeight: 16px
      letterSpacing: 0.08em
    label-sm:
      fontSize: 11px
      fontWeight: '700'
      lineHeight: 14px
      letterSpacing: 0.06em
    headline-xl-mobile:
      fontSize: 30px
      fontWeight: '700'
      lineHeight: 36px
      letterSpacing: -0.01em
    headline-lg-mobile:
      fontSize: 24px
      fontWeight: '700'
      lineHeight: 30px
      letterSpacing: -0.01em

rounded:
  sm: 0.25rem        # 4px
  DEFAULT: 0.5rem    # 8px (Supervisor cards & action buttons baseline)
  md: 0.75rem       # 12px
  lg: 1rem          # 16px (Frontline worker card containers)
  btn-worker: 14px  # Worker action buttons
  xl: 1.5rem        # 24px
  full: 9999px      # Capsule / pill provenance badges & status pills

spacing:
  spacing-2xs: 4px
  spacing-xs: 8px
  spacing-sm: 12px
  spacing-md: 16px
  spacing-lg: 24px
  spacing-xl: 32px
  spacing-2xl: 40px
  spacing-3xl: 48px
  # Worker Field Spacing
  touch-target-min: 56px
  touch-target-preferred: 64px
  btn-primary-height: 68px
  btn-secondary-height: 60px
  screen-padding: 24px
  # Supervisor Desktop Spacing
  gutter-mobile: 16px
  gutter-desktop: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  btn-supervisor-height: 44px
  btn-supervisor-touch-height: 52px
---

# AURA Design System

The **AURA Design System** unifies frontline voice-directed operations and daylight-optimized desk supervision into a single coherent industrial instrument. It rejects consumer chatbot tropes, conversational bubble threads, decorative glassmorphism, and skeuomorphic gimmicks. Across both physical field conditions and supervisor monitoring stations, AURA embodies a **Calm, High-Contrast Industrial Safety Instrument** engineered for mission-critical reliability, rapid micro-glances, and decisive safety governance.

The system encompasses two complementary experiences:
1. **Worker Experience (Frontline Industrial Voice Instrument):** Optimized for high-noise mechanical bays, chemical facilities, heavy utility gloves, vibrating machinery, and severe glare or dim emergency lighting.
2. **Supervisor Experience (Supervisor Safety Cockpit):** Optimized for shift directors, plant safety leads, and operational commanders managing high-density telemetry, procedural audit logs, and irreversible verification sign-offs on daylight monitors.

```
AURA Design System
├── 1. Shared Visual Language
│   ├── Architecture & Design Philosophy
│   ├── Colour System & Inks
│   ├── Typography Foundations
│   ├── Spacing & Radii System
│   ├── Safety Semantics & Color Isolation Rule
│   └── AURA Identity & Motion Language
│
├── 2. Worker Experience — Frontline Industrial Voice Instrument
│   ├── Context & Frontline Ergonomics
│   ├── Worker Typography Hierarchy
│   ├── Worker Touch Targets & Spacing
│   ├── Worker Elevation & Depth (Layers 0–2)
│   └── Worker Shapes, Cards & Voice Fallbacks
│
└── 3. Supervisor Experience — Supervisor Safety Cockpit
    ├── Context & Daylight Architecture
    ├── Supervisor Typography Hierarchy
    ├── Desktop Grid & Responsive Ergonomics
    ├── Supervisor Depth Layers (Levels 0–3)
    └── Supervisor Cockpit Components (Sections 1–6)
```

---

## 1. Shared Visual Language

### 1.1 Architecture & Design Philosophy
AURA treats software as an avionics flight deck or precision diagnostic instrument rather than an informal chat interface.

- **Instant Optical Legibility:** High-contrast solid fills, deep dark inks, and generous letter spacing engineered for rapid micro-glances (200–500ms).
- **Physical Ergonomics First:** Touch boundaries are strictly calibrated to user context: oversized 56px–64px targets with bottom-biased layout for gloved field workers; crisp 44px controls for multi-pane desktop navigation.
- **Auditory & Visual Parity:** Voice is primary in the field, but every spoken prompt, status change, and confirmation is simultaneously rendered in rock-solid visual typography.
- **Transparent Safety Rigor:** Uncertainty is never concealed. When readings or values are ambiguous, the system signals verification states with unmistakable industrial amber rather than false confidence.

### 1.2 Colour System & Inks
The colour palette provides maximum perceptual contrast under harsh direct sunlight, dusty facility screens, and standard indoor daylight monitors.

#### Semantic Invariants
- **Aura Teal (`#0E7774` / `#075B5A`):** The primary interaction anchor representing the active co-pilot. Used for the interactive Voice Orb, active listening rings, primary execution triggers, and confirmed procedural steps.
- **Secondary Surface (`#D6E8EA`):** A soft, cool teal tint used for interactive wells, selected parameter chips, search fields, and non-critical card backgrounds.
- **App Background (`#EFF3F6`):** An architectural, low-glare blue-gray canvas that mitigates eye fatigue across continuous 12-hour shifts while preserving contrast under fluorescent or sunlight conditions.
- **Structural White (`#FFFFFF`):** High-clarity foreground surface for cards, tiles, and cockpit panels.
- **Border Structural (`#D0DCE5`):** Explicit 1px bounding line applied to interactive cards, sidebars, and nested data pods to provide physical structure without muddy drop shadows.

#### Safety Semantic Rails
- **Warning Amber (`#F0A51A` / `#FEF7E0` / `#92400E`):** Signals non-critical uncertainty, checking loops, incomplete parameters, sensor drifts, or procedural hold steps requiring manual inspection. It does not mean stop; it means *verify*.
- **Danger Red (`#C9362B` / `#FCE8E6` / `#991B1B`):** Reserved exclusively for safety halts, procedural abort gates, immediate sentinel threshold trips, and supervisor escalation. When danger red enters the viewport, it visually commands the entire screen hierarchy.
- **Success Green (`#237A4B` / `#E6F4EA` / `#166534`):** Unambiguous verification, saved reports, closed work orders, and completed checklist gates.

#### Inks & Contrast Architecture
- **`ink-950` (`#111C24`):** Delivers an 11:1+ contrast ratio against `#EFF3F6` for all critical safety copy, numeric readings, values, and dark shells.
- **`ink-900` (`#1B2A33`):** High-contrast secondary ink for verbatim worker quotes and table content.
- **`ink-700` (`#40515A`):** Delivers certified WCAG AAA 7:1 contrast for contextual sentences and table annotations.
- **`ink-500` (`#6F7E85`):** Strictly limited to non-critical metadata (timestamps, revision numbers, uppercase column labels). It is **never** applied to safety warnings, readings, or interactive controls.

### 1.3 Typography Foundations
The typography system strictly uses **Atkinson Hyperlegible Next** (fallback: standard Atkinson Hyperlegible / sans-serif) across all functional tiers. The font's explicit glyph disambiguation—clearly distinguishing `0` from `O`, `1` from `l` and `I`, and `5` from `S` / `8` from `B`—prevents catastrophic misinterpretation of high-stakes asset tags, hazardous valve IDs, worker badges, and atmospheric telemetry.

- **Weight Floor:** Core text never falls below weight `500` (Medium). Thin or light stroke weights are prohibited to prevent character degradation under extreme ambient glare or low-resolution field screens.
- **Uppercase Labels:** System status tokens, step metadata counters (e.g., `STEP 2 OF 7`), and field provenance badges utilize uppercase casing with `0.08em` tracking for instant chunking.
- **Numeric Tabular Alignment:** All numeric sensor metrics (PSI, PPM, dB, °C) inherit tabular figures (`font-variant-numeric: tabular-nums`) to eliminate horizontal jitter during live telemetry updates.

### 1.4 Spacing & Radii System
- **Base Rhythm:** 8px base modular rhythm (`space-2xs: 4px`, `space-xs: 8px`, `space-sm: 12px`, `space-md: 16px`, `space-lg: 24px`, `space-xl: 32px`, `space-2xl: 40px`, `space-3xl: 48px`).
- **Corner Curvature:**
  - `sm: 0.25rem` (4px): Small nested inputs, inner meters.
  - `DEFAULT: 0.5rem` (8px): Supervisor cockpit cards, interactive buttons, and table containers.
  - `btn-worker: 14px`: Worker touch action buttons.
  - `lg: 1rem` (16px): Worker field card containers.
  - `full: 9999px`: All status pills, provenance badges, and field origin tags.

### 1.5 Safety Semantics & Color Isolation Rule
> **MANDATORY COLOR ISOLATION RULE:** Color is NEVER the sole communicator of safety state. Every status, alert, or trip must pair a chromatic token with an explicit icon (minimum 28px in field alerts, 16px–20px in desktop tables) and structured verbal text.

- **State Transitions:** Normal (Teal) → Checking / Incomplete (Amber) → Trip / Halt (Red) → Verified / Complete (Green).
- **Auditory Accompaniment:** Visual safety halts correspond directly with spoken voice interruptions and audio alert chimes.

### 1.6 AURA Identity & Motion Language
The **AURA Voice Element** serves as the dynamic visual heartbeat of the system across both Worker and Supervisor interfaces:
- **Orb Geometry:** A mathematically pure circle (50% radius) bounded by concentric segmented ring strokes (SVG viewBox 0 0 2000 2000, center 1000px, 1000px).
- **Listening State:** Outer Ring 2 rotates smoothly (`aura-ring2-spin`, 360° over 12s) with an active teal glow (`glow-pulse-normal`).
- **Speaking State:** Core identity gently pulses (`aura-core-pulse`, 1.0 to 1.045 scale over 2s).
- **Processing / Verification:** Concentric amber sweep indicating SOP and manual pattern matching.
- **Safety Trip:** Orb snaps to solid `danger-red` (`#C9362B`) with an assertive outer warning pulse (`glow-pulse-danger`).
- **Reduced Motion:** When `prefers-reduced-motion: reduce` is detected, animations snap instantly to 0.01ms with static chromatic ring boundaries.

---

## 2. Worker Experience — Frontline Industrial Voice Instrument

The Worker Experience (`/worker`) is engineered for hands-free and glanceable field operations where ambient noise reaches 85–100 dB, workers wear protective equipment, and cognitive bandwidth must remain focused on physical machinery.

### 2.1 Frontline Ergonomics
- **Micro-Glance Optimization:** Key directives and parameter confirmations are readable within 200–500ms.
- **Gloved Touch Tolerances:** All tap zones meet or exceed `56px` (preferred `64px`), eliminating accidental touches when operating with thick nitrile, cut-resistant, or leather gloves.
- **Bottom-Biased Controls:** High-frequency actions (mic toggle, barge-in stop, step advance) sit anchored to the bottom thumb zone.

### 2.2 Worker Typography Hierarchy
| Token | Size | Weight | Line Height | Tracking | Primary Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `large-reading` | 36px (32px mobile) | 700 | 42px (38px mobile) | -0.01em | Live spoken confirmation values & urgent alerts |
| `state-display` | 32px (28px mobile) | 700 | 38px (34px mobile) | -0.01em | Primary device mode (`LISTENING`, `SPEAKING`) |
| `screen-title` | 24px | 700 | 30px | 0em | Procedure / inspection section headers |
| `primary-text` | 22px | 600 | 30px | 0em | Current step action directive |
| `body` | 18px | 500 | 26px | 0em | Supporting procedural notes and equipment safety tips |
| `metadata` | 16px | 500 | 22px | 0.01em | Secondary equipment tags, units, and timestamps |
| `label` | 14px | 700 | 18px | 0.08em | Step progress pills, status markers (UPPERCASE) |

> **Frontline Rule:** No text below 14px is permitted in the field worker interface.

### 2.3 Worker Touch Targets & Spacing
- **Minimum Tap Zone:** `56px × 56px` (`--touch-target-min`).
- **Preferred Tap Zone:** `64px × 64px` (`--touch-target-preferred`).
- **Primary Execution Button Height:** `68px` (`--btn-primary-height`).
- **Secondary Action Button Height:** `60px` (`--btn-secondary-height`).
- **Screen Margins:** `24px` gutter and edge padding.

### 2.4 Worker Elevation & Depth
Depth in the field relies on solid tonal stacking without diffuse drop shadows that wash out under sunlight:
- **Layer 0 (Canvas Base):** Solid `app-background` (`#EFF3F6`).
- **Layer 1 (Card Containers & Inset Panels):** Solid `surface` (`#FFFFFF`) or `secondary-surface` (`#D6E8EA`). Features a 1px solid `#D0DCE5` border and faint anchor shadow (`0 2px 4px rgba(17, 28, 36, 0.06)`).
- **Layer 2 (Safety Alert Override):** Safety alerts break canvas layering entirely by painting a solid `danger-red` (`#C9362B`) full-bleed mantle over the interface, pinning operator focus to the imminent hazard.

### 2.5 Worker Shapes, Cards & Voice Fallbacks
- **Card Containers:** `16px` border radius (`rounded-lg`), providing soft, contained boundaries for grouped inspection steps and draft fields.
- **Action Buttons:** `14px` border radius, creating defined touch targets that retain structural industrial precision.
- **Safety Alert Banner (`SafetyAlertBanner.tsx`):** Full-bleed danger red mantle with 28px `AlertOctagon` icon, structured parameter deviation readout (safe range vs. measured), and dual 56px touch actions (`VIEW PROTOCOL`, `ACKNOWLEDGE`).
- **Text & Keyboard Fallback (`TextKeyboardFallback.tsx`):** Accessible, bottom-anchored high-contrast typing panel enabled for high-noise acoustic dropouts or muted mic scenarios.

---

## 3. Supervisor Experience — Supervisor Safety Cockpit

The Supervisor Experience (`/inbox`, `/patterns`, `/maintenance`, `/review/:id`, `/audit`) translates the industrial safety language to desktop monitors and rugged field tablets. It emphasizes high-density telemetry, procedural audit trails, and multi-step safety approvals.

### 3.1 Daylight Architecture & Philosophy
- **Daylight-Optimized:** Built on `#EFF3F6` to prevent glare and eye fatigue during long 12-hour facility shifts.
- **Instrument-Grade Contrast:** Deep structural inks (`ink-950`, `ink-700`) ensure critical readings and worker alerts are legible from across a supervisor desk.
- **Structured Records:** Voice transcripts and AI-inferred fields are rendered as certified records rather than informal chat threads.

### 3.2 Supervisor Typography Hierarchy
| Token | Size | Weight | Line Height | Tracking | Primary Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `headline-xl` | 36px (30px mobile) | 700 | 42px (36px mobile) | -0.01em | High-level metrics, shift banner counters |
| `headline-lg` | 28px (24px mobile) | 700 | 34px (30px mobile) | -0.01em | Incident titles, dossier headers |
| `headline-md` | 24px | 700 | 30px | 0em | Section headers, card group titles |
| `headline-sm` | 20px | 600 | 26px | 0em | Modal titles, alert banner headers |
| `body-lg` | 18px | 500 | 26px | 0em | Primary narrative descriptions, worker quotes |
| `body-md` | 16px | 500 | 24px | 0em | Table cell copy, card narrative body |
| `body-sm` | 14px | 500 | 20px | 0.01em | Secondary metadata, parameter notes |
| `label-lg` | 14px | 700 | 18px | 0.08em | Button labels, primary status markers (UPPERCASE) |
| `label-md` | 12px | 700 | 16px | 0.08em | Table column headers, provenance badges (UPPERCASE) |
| `label-sm` | 11px | 700 | 14px | 0.06em | Timestamp pills, micro telemetry tags (UPPERCASE) |

### 3.3 Desktop Grid & Responsive Ergonomics
The supervisor cockpit utilizes a multi-pane fluid dashboard model configured to present operational data without horizontal scrolling.

- **Desktop (1440px+):** A 12-column dynamic grid with fixed 24px (`1.5rem`) gutters and 32px (`2rem`) outer canvas margins. Maximum container width is constrained to `1440px`. Features a persistent 280px left rail (plant navigation & worker directory), a central operational stage (6–8 columns), and an expandable 380px right rail for live telemetry, voice stream transcripts, and AI-inferred safety checks.
- **Tablet / Rugged Toughpad (768px – 1024px):** Reflows to an 8-column layout with 16px gutters. The voice transcript drawer transitions to a collapsible slide-over drawer.
- **Mobile / Supervisor Pocket View (< 768px):** Single-column stacked stream with 16px horizontal margins, prioritizing active red-alert banners and pending worker sign-off requests.

### 3.4 Supervisor Depth Layers
- **Level 0 (Canvas Base):** Solid `app-background` (`#EFF3F6`).
- **Level 1 (Cockpit Cards & Workstations):** Solid `surface` (`#FFFFFF`) with 1px solid `border-structural` (`#D0DCE5`) and subtle grounding shadow (`0 1px 3px rgba(17, 28, 36, 0.05)`).
- **Level 2 (Active Telemetry Focus & Drawers):** `#FFFFFF` surfaces with 1px `#BDC9C7` outline and focused directional shadow (`0 8px 16px rgba(17, 28, 36, 0.08)`).
- **Level 3 (Safety Halt Overrides & Modals):** High-priority modals and safety stop bars with solid `#C9362B` or `#111C24` fill, backed by a 60% opacity dark scrim (`#111C24`) that locks the workspace until acknowledged.

---

### 3.5 Supervisor Cockpit Components

*(Maintained canonical component numbering cited across FE-004 source files)*

#### 1. Aura Co-Pilot Supervisor Stream
- **Purpose:** Displays live worker-side voice transmissions, AI speech-to-intent parsing, and co-pilot recommendations.
- **Visuals:** Contained in a Level 1 `#FFFFFF` panel with a 1px `#D0DCE5` border.
- **Telemetry Header:** Displays worker identity, equipment serial, battery/signal bars, and a miniature 24px Aura Voice Orb reflecting worker microphone activity:
  - *Teal Ring Pulse:* Worker actively speaking.
  - *Amber Sweep:* Co-pilot processing audio against standard operating procedures.
  - *Red Solid Octagon:* Safety hold voiced or emergency halt triggered.
- **Transcript Block:** Inks use `ink-900` (`#1B2A33`) for worker verbatim quotes and `ink-700` (`#40515A`) for system summaries.

#### 2. Action Buttons
- **Primary Execution (Approve Sign-off / Clear Gate):**
  - Height: `44px` (Desktop) / `52px` (Touch). Radius: `8px`.
  - Fill: `aura-teal` (`#0E7774`) with `#FFFFFF` text (`label-lg`). Hover: `aura-teal-dark` (`#075B5A`). Focus: 2px offset outline.
- **Secondary Action (Request Retest / Flag Worker):**
  - Height: `44px`. Radius: `8px`.
  - Fill: `secondary-surface` (`#D6E8EA`) with `ink-950` text (`label-lg`) and 1px `#BDC9C7` border.
- **Supervisor Emergency Stop:**
  - Solid `danger-red` (`#C9362B`) with `#FFFFFF` text. Triggers immediate audible alert and worker lockout.

#### 3. Hold-to-Confirm Sign-off (`HoldToConfirmButton.tsx`)
- **Purpose:** Critical irreversible safety approvals (permits to work, hazardous atmosphere sign-offs, near-miss approvals).
- **Behavior:** Requires a continuous 1000ms mouse click, touch hold, or Space/Enter press.
- **Progress Feedback:** A horizontal progress sweep in `var(--success-green)` (`#237A4B`) fills the button background from left to right, executing `onConfirm` only once full duration is achieved. Releasing early resets progress.

#### 4. Provenance & Verification Chips (`ProvenanceBadge.tsx`)
- Compact pills (`24px` height, `9999px` radius, uppercase `11px` / `700` with `0.08em` tracking) applied to incoming telemetry fields:
  - `WORKER SAID`: `#D6E8EA` fill, `ink-900` text, microphone icon.
  - `AI INFERRED`: `#FEF7E0` fill, `warning-amber` (`#F0A51A`) text, spark icon.
  - `VERIFIED`: `#E6F4EA` fill, `success-green` (`#237A4B`) text, checkmark icon.
  - `OUT OF SPEC`: `#FCE8E6` fill, `danger-red` (`#C9362B`) text, alert octagon icon.

#### 5. Data Tables & Telemetry Matrix (`Maintenance.tsx`, `AuditView.tsx`)
- **Header:** Uppercase `label-md` tracking `0.08em` in `ink-500` on an `#EFF3F6` background. 1px bottom border `#D0DCE5`.
- **Row Styling:** Row height `48px`. Zebra striping prohibited; rows demarcated by 1px `#D0DCE5` bottom divider.
- **Reading Values:** All numeric metrics use tabular figures (`tabular-nums`) in `ink-950` paired with uppercase unit labels in `ink-500` (e.g., `14.2` `PPM`).

#### 6. Safety Alert Banner & Modal Override
- Extends the frontline visual language to workstation monitors.
- Full-width banner pinned to top of screen in solid `#C9362B` with `#FFFFFF` bold type (`headline-sm`).
- Displays affected asset, reporting technician name, time of deviation, and immediate dual actions: `ACKNOWLEDGE SHIFT HALT` and `BROADCAST ALL-STATIONS`.