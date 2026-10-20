# XtraSecurity Dashboard Design System & UX Specification

> **AI Prompt Context**: Use this document as the master UI/UX style guide and system prompt when building, refactoring, or generating dashboard pages, sidebars, and data views. Replicate these exact tokens, spacing rules, color palettes, curves, and human-experience interactions.

---

## 1. Design Philosophy & Aesthetic Identity

- **Style**: Modern, developer-first, cloud-security SaaS (comparable to Linear, Vercel, Supabase, and Stripe).
- **Tone**: High signal-to-noise ratio, crisp information density, calm dark-slate canvas with focused cyan/teal electric accents.
- **Visual Depth**: Subtle layered surfaces (`bg-muted/20` page backdrop $\to$ `bg-card` containers $\to$ `bg-muted/40` nested pills), hairline borders (`border-border/40`), and delicate tinted glow effects rather than loud drop shadows.

---

## 2. Typography System

The interface uses a clean multi-tiered typography hierarchy powered by **Inter** (interface & body) and **Space Grotesk** (brand headings & buttons), with **GeistMono / JetBrains Mono** for cryptographic identifiers, tokens, and code.

| Element | Class / Token | Size | Weight | Line Height | Tracking | Font Family |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title** | `h1` | `text-3xl` (30px) | `font-bold` (700) | `leading-tight` | `tracking-tight` (-0.025em) | Inter / Sans |
| **Section Heading** | `h2` | `text-xl` (20px) | `font-semibold` (600) | `leading-normal` | `tracking-tight` (-0.02em) | Inter / Sans |
| **Card / Item Title** | `h3` | `text-lg` / `text-base` | `font-semibold` (600) | `leading-snug` | Normal | Inter / Sans |
| **Stat Numbers** | Metric Value | `text-3xl` (30px) | `font-bold` (700) | `leading-none` | `tracking-tight` | Inter / Sans |
| **Body / Description** | `p` | `text-sm` (14px) | `font-normal` (400) | `leading-relaxed` | Normal | Inter / Sans |
| **Subtext / Muted** | `span`, `p` | `text-xs` (12px) | `font-normal` (400) | `leading-normal` | Normal | Inter / Sans |
| **Sidebar Group Headers** | `h4` | `text-xs` (11-12px) | `font-semibold` (600) | `leading-none` | `tracking-wider` (uppercase) | Inter / Sans |
| **Navigation Item** | Sidebar `a` / `button` | `text-sm` (13.5px) | `font-medium` (500) | `leading-none` | Normal | Inter / Sans |
| **Badges & Pills** | Status badge | `text-[10px]` - `text-xs` | `font-bold` (700) | `leading-none` | `tracking-wider` (uppercase) | Inter / Sans |
| **Secrets / Hashes / Keys** | Code snippet | `text-xs` (12px) | `font-mono` (400) | `leading-none` | Normal | GeistMono / Mono |

---

## 3. Color Palette & Theme Tokens

The application features full Light and Dark mode pairing with OKLCH / HSL precision:

### A. Dark Mode Palette (Primary Experience)
```css
--background: oklch(0.12 0.02 220);         /* Deep obsidian blue-gray: #0b101b */
--foreground: oklch(0.95 0.01 200);         /* Crisp off-white text: #f1f5f9 */
--card: oklch(0.15 0.02 220);               /* Elevated slate card surface: #0f172a */
--card-foreground: oklch(0.95 0.01 200);
--muted: oklch(0.25 0.02 220);              /* Subdued elements & hover surfaces: #1e293b */
--muted-foreground: oklch(0.70 0.02 200);   /* Secondary slate text: #94a3b8 */
--border: oklch(0.25 0.02 220);             /* Subtle hairline borders: rgba(255,255,255,0.08) */

/* Accents */
--primary: oklch(0.65 0.15 180);            /* Electric Cyan: #06b6d4 / #0ea5e9 */
--primary-foreground: oklch(0.12 0.02 220); /* Dark text on primary buttons */
--accent: oklch(0.55 0.15 200);             /* Cyan-Blue accent */
--destructive: oklch(0.55 0.20 25);         /* Incident / Danger Red: #ef4444 */
```

### B. Light Mode Palette
```css
--background: oklch(0.98 0.01 200);         /* Clean ice-white canvas: #f8fafc */
--foreground: oklch(0.35 0.02 220);         /* Deep slate navy text: #0f172a */
--card: oklch(1.00 0.00 0);                 /* Pure white surface: #ffffff */
--muted: oklch(0.92 0.02 200);              /* Soft light gray: #f1f5f9 */
--muted-foreground: oklch(0.55 0.02 220);   /* Mid slate: #64748b */
--border: oklch(0.88 0.02 200);             /* Crisp light gray border: #e2e8f0 */
--primary: oklch(0.35 0.15 200);            /* Deep Ocean Blue: #0284c7 */
```

### C. Semantic Status Accent Mapping
- **Active / Primary**: Cyan/Teal (`#0ea5e9` / `#06b6d4`), badge `bg-primary/10 text-primary`
- **Success**: Emerald Green (`#10b981`), badge `bg-emerald-500/10 text-emerald-500`
- **Security Warning**: Amber (`#f59e0b`), badge `bg-amber-500/10 text-amber-500`
- **Critical / Incidents**: Crimson Red (`#ef4444`), badge `bg-red-500/10 text-red-500`
- **Informational / Analytics**: Sky Blue (`#3b82f6`), badge `bg-blue-500/10 text-blue-500`

---

## 4. Curves, Borders & Elevation (Radii & Shadows)

Modern UI avoids boxy sharp corners while avoiding overly bubbly rounded bubbles.

- **Main Cards / Panels**: `rounded-xl` (`12px`) or `rounded-2xl` (`16px`)
- **Buttons & Form Inputs**: `rounded-lg` (`8px`)
- **Nav Links in Sidebar**: `rounded-md` (`6px`)
- **Nested Pills / Chips / Tags**: `rounded-md` (`6px`) or `rounded-sm` (`4px` for compact badges)
- **Avatars / Status Dots**: `rounded-full` (`9999px`)
- **Borders**: Standard `border border-border/40` (faint opacity prevents visual clutter).
- **Shadows**:
  - Cards: `shadow-sm hover:shadow-md transition-all duration-200`
  - Primary CTA Buttons: `shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]`
  - Dropdowns & Popovers: `shadow-xl border border-border/60 backdrop-blur-xl`

---

## 5. Spacing, Margins & Padding Scale

Consistency in spacing gives the dashboard its calm, airy feel.

### Page Architecture
```tsx
<div className="min-h-screen bg-muted/20">
  {/* Desktop Sidebar (Fixed) */}
  <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-50">
    <DashboardSidebar className="w-64 border-r border-border" />
  </div>

  {/* Main Workspace (Offset by sidebar width) */}
  <div className="lg:pl-64">
    <DashboardHeader className="h-14 sticky top-0 z-40 px-6 border-b" />
    <main className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Content Sections */}
    </main>
  </div>
</div>
```

### Component Internal Padding
- **Stats Card**: `CardHeader pb-2 pt-5 px-5`, `CardContent px-5 pb-5`
- **Content Card (e.g. Project Card)**: `CardHeader px-5 pt-5 pb-3`, `CardContent px-5 pb-5 pt-2`
- **Sidebar Nav Items**: `px-3 py-2 gap-3`
- **Sidebar Header**: `h-14 px-6` (56px fixed vertical center)
- **Top Header Bar**: `h-14 px-6` (56px)
- **Search & Input Elements**: `h-9` or `h-10 px-3`

---

## 6. The Sidebar Design System

The sidebar is the primary anchor of user workflow:

### Structure & Layout (Top to Bottom)
1. **Brand Bar (`h-14 flex items-center px-6 border-b border-border/40`)**:
   - 28x28px rounded logo icon + `text-lg font-bold tracking-tight` brand name.
2. **Workspace Switcher (`p-4 pb-2`)**:
   - Sleek dropdown trigger button (`w-full justify-between h-10 px-3 rounded-lg border border-border/60 bg-background/50 hover:bg-background`).
   - Displays workspace avatar + name + `ChevronsUpDown` icon.
   - Popover contains searchable command list with "Create New Workspace" quick action.
3. **Scrollable Navigation Area (`flex-1 min-h-0 px-4 py-2`)**:
   - Grouped sections:
     - `Platform` (Dashboard, Projects, Teams)
     - `Security` (Security Health, Usage Analytics, Secret Rotation, Access Requests, Audit Logs)
     - `Configuration` (Integrations, Notifications, Settings, Subscription, Docs)
   - Category Label: `px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2`.
   - Nav Link States:
     - **Inactive**: `text-muted-foreground hover:bg-muted hover:text-foreground`
     - **Active**: `bg-primary/10 text-primary font-medium` (gentle tinted highlight, matching icon color).
4. **User Footer Bar (`p-4 border-t border-border/40 bg-zinc-50/50 dark:bg-zinc-900/50`)**:
   - User Avatar (32x32px), User Name (`text-sm font-medium truncate`), User Email (`text-xs text-muted-foreground truncate`).
   - Click opens dropdown menu with: Profile, Subscription, Theme Toggle (Light/Dark Sun/Moon), and Destructive Red Logout action.

---

## 7. Human Experience (UX) & Interaction Patterns

1. **Scroll State Preservation**:
   - When navigating between pages via the sidebar, the sidebar maintains its exact scroll position using a persistent ref listener (`scrollTopRef`), eliminating jarring jump-to-top flashes.
2. **Visual Hierarchy on Cards**:
   - **Accent Strip Indicator**: Interactive cards feature a left accent bar (`w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300`), providing intuitive visual confirmation when hovering.
   - **Color-Coded Stat Borders**: Metric cards have colored left borders (`border-l-4 border-l-primary`, `border-l-4 border-l-blue-500`, `border-l-4 border-l-red-500`), communicating health at a single glance.
3. **Empty States with Clear Next Actions**:
   - Never show blank space. Present a centered dashed panel (`border-2 border-dashed border-border/50 rounded-xl bg-muted/5 p-12 text-center`), a subtle muted icon, friendly copy, and a prominent CTA button (e.g. `+ Create Project`).
4. **Live Activity Timeline**:
   - Visual vertical connector rail (`border-l border-border/50 ml-4`) with glowing colored dot indicators (`ring-4 ring-background`), showing recent audit/security events with relative timestamps.
5. **Fluid Micro-Animations**:
   - Page Entrance: `animate-in fade-in duration-300`
   - Primary Buttons: `transition-all hover:scale-[1.02] active:scale-[0.98]`
   - Modals & Dialogs: Smooth backdrop blur (`backdrop-blur-md bg-black/40`) with scale-in transition.

---

## 8. Copy-Paste Component Blueprint for AI Generation

When asking an AI to build a new page or view matching this design system, provide this blueprint:

```tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Plus, Search } from "lucide-react";

export function StandardDashboardView() {
  return (
    <div className="space-y-8 p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor infrastructure health and operational metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="lg" className="shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="mr-2 h-4 w-4" /> New Resource
          </Button>
        </div>
      </div>

      {/* 2. Stat Metric Cards (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-primary rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Activity className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-3xl font-bold tracking-tight text-foreground">148,290</div>
            <p className="text-xs text-muted-foreground mt-1">+12.4% from last week</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```
