# CodeQuest UI/UX Specification

## University Coding Assessment Platform

**Version:** 2.1
**Last Updated:** 2026-03-20T22:00:00Z
**Status:** Reflects actual implementation as of this date (post-55-item hardening plan)

---

## Table of Contents

1. [Design System](#1-design-system)
2. [Color Palette & Typography](#2-color-palette--typography)
3. [Component Inventory](#3-component-inventory)
4. [Screen Inventory](#4-screen-inventory)
5. [Route Structure & Navigation](#5-route-structure--navigation)
6. [Layout System](#6-layout-system)
7. [Design Conventions](#7-design-conventions)
8. [Accessibility](#8-accessibility)
9. [Responsive Design](#9-responsive-design)
10. [Dark Mode](#10-dark-mode)

---

## 1. Design System

### 1.1 Design Philosophy

- **Professional clarity** over decorative flair — no gradients on hero sections, no glassmorphism, no animated backgrounds
- **Flat, solid colors** with subtle elevation via `shadow-sm` on cards and `shadow-xl` max on modals
- **Scoped transitions** on interactive elements only (buttons, inputs, links) — no global `*` transition rules
- **Material Symbols Outlined** icon set (Google) — variable weight/fill, no emoji, no Font Awesome
- **Manrope** for all UI text, **JetBrains Mono** for code — no Inter, no system fonts

### 1.2 Technology Stack

| Layer | Technology |
|---|---|
| CSS Framework | Tailwind CSS (CDN, runtime JIT) |
| Icon Set | Material Symbols Outlined (variable font) |
| UI Font | Manrope (300–800 weights) |
| Code Font | JetBrains Mono (400–600 weights), Fira Code fallback |
| Code Editor | Monaco Editor via `@monaco-editor/react` |
| Charts | Recharts |
| Dark Mode | Tailwind `class` strategy, toggled via Layout |

---

## 2. Color Palette & Typography

### 2.1 Custom Colors (Tailwind `extend.colors`)

Defined in `index.html` Tailwind config:

| Token | Hex | Usage |
|---|---|---|
| `primary.DEFAULT` | `#0d8ea5` | Buttons, active states, links, brand accent |
| `primary.dark` | `#0a7385` | Button hover, hero backgrounds |
| `primary.light` | `#208192` | Subtle tints |
| `background.light` | `#f6f8f8` | Page background (light mode) |
| `background.dark` | `#101f22` | Page background (dark mode) |
| `background.card` | `#1a2c30` | Card surfaces (dark mode) |

All other colors use Tailwind defaults: `slate`, `red`, `green`, `amber`, `blue`, `purple`, `orange`, `emerald`, `teal`.

### 2.2 Typography

| Element | Font | Weight | Tailwind Class | Notes |
|---|---|---|---|---|
| Page headings | Manrope | 700 | `text-3xl font-bold` | `letter-spacing: -0.02em` via index.css |
| Section headings | Manrope | 700 | `text-xl font-bold` | |
| Body text | Manrope | 400 | Default | `letter-spacing: -0.011em` via index.css |
| Labels | Manrope | 600 | `text-sm font-semibold` | |
| Small/muted text | Manrope | 500 | `text-sm text-slate-500` | `dark:text-slate-400` |
| Code / monospace | JetBrains Mono | 400 | `font-mono` | Fira Code fallback |
| Buttons | Manrope | 700 | `font-bold` | Never `font-black` (w900) |

### 2.3 Font Rendering (index.css)

```css
body {
  line-height: 1.5;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: -0.011em;
}
h1, h2, h3, h4, h5, h6 {
  letter-spacing: -0.02em;
}
```

---

## 3. Component Inventory

### 3.1 Shared Components (`components/`)

| Component | File | Purpose |
|---|---|---|
| Layout | `Layout.tsx` | Sidebar + top bar + main content wrapper; handles all 3 roles |
| ConfirmModal | `ConfirmModal.tsx` | Styled confirmation dialog; `danger`/`warning`/`info` variants; ARIA attributes |
| ErrorBoundary | `ErrorBoundary.tsx` | React error boundary with styled fallback UI |

### 3.2 Shared Utilities (`utils/formatters.ts`)

Centralized formatting functions used across 10+ screens:

- `formatDate`, `formatDateShort`, `formatTime`, `formatDateTime`, `formatRelativeTime`
- `formatDuration` (seconds to "Xm Ys")
- `getInitials` (name to avatar initials)
- `getAssessmentStatusBadge`, `getSubmissionStatusColor`, `getSubmissionStatusIcon`
- `getDifficultyColor`, `getDifficultyBadge`
- `getNotificationIcon`, `getNotificationColor`
- `validatePassword`, `isPasswordValid`
- `escapeHtml` (XSS prevention for export)

### 3.3 Inline Patterns (not extracted to components)

These patterns are used across multiple screens but implemented inline:

- **Stat cards**: 4-column grid with icon, label, value — used in StudentProfile, ProfessorDashboard, SystemHealth, UserManagement
- **Data tables**: 12-column CSS grid with header row, dividers — used in Leaderboard, SubmissionHistory, SystemLogs
- **Filter bars**: Search input + select dropdowns + view toggles — used in Leaderboard, QuestionBank, AllAssessments, UserManagement
- **Form layouts**: Label + input stacks with `space-y-4` — used in Login, Signup, CreateQuestion, CreateAssessment, StudentProfile
- **Empty states**: Centered icon + message when data is absent — inconsistently implemented
- **Loading spinners**: `animate-spin` on a bordered circle div — used inline in buttons

---

## 4. Screen Inventory

### 4.1 Public Screens (no auth required)

| Screen | File | Route | Description |
|---|---|---|---|
| Login | `Login.tsx` | `/login` | Email/password form with split layout (branding left, form right on desktop) |
| Signup | `Signup.tsx` | `/signup` | Registration with role, department, enrollment ID; password strength validation |
| Forgot Password | `ForgotPassword.tsx` | `/forgot-password` | Email input for reset link |
| Reset Password | `ResetPassword.tsx` | `/reset-password` | New password entry from Supabase recovery URL |
| Role Selection | `RoleSelection.tsx` | `/role-select` | Demo/development screen; 3 role cards |

### 4.2 Student Screens

| Screen | File | Route | Description |
|---|---|---|---|
| Dashboard | `StudentDashboard.tsx` | `/student/dashboard` | Greeting, upcoming assessments list with status badges |
| Assessments | `AllAssessments.tsx` | `/student/assessments` | Filterable assessment list with search, status, difficulty filters |
| Assessment Instructions | `AssessmentInstructions.tsx` | `/student/assessments/:id/instructions` | Pre-exam instructions with rules and start button |
| Code Editor | `CodeEditor.tsx` | `/student/assessments/:id/editor` | Monaco editor with problem panel, test runner, submission; ~1700 lines |
| Assessment Results | `AssessmentResults.tsx` | `/student/assessments/:id/results` | Score summary with per-question breakdown |
| Submissions | `SubmissionHistory.tsx` | `/student/submissions` | Sortable/filterable submission history with detail expansion |
| Leaderboard | `Leaderboard.tsx` | `/student/leaderboard` | Podium + table/card views with search, department filter, time range |
| Profile | `StudentProfile.tsx` | `/student/profile` | Hero banner, stats cards, settings form, edit/share modals |
| Notifications | `Notifications.tsx` | `/student/notifications` | Notification list with read/unread, type icons, relative timestamps |

### 4.3 Professor Screens

| Screen | File | Route | Description |
|---|---|---|---|
| Dashboard | `ProfessorDashboard.tsx` | `/professor/dashboard` | Quick actions (assessments, questions, leaderboard) |
| Assessment Hub | `ProfessorAssessmentHub.tsx` | `/professor/assessments` | Tabbed view: assessments list, questions, submissions |
| Create Assessment | `CreateAssessment.tsx` | `/professor/assessments/create` | Multi-step wizard: details, questions, settings, review |
| Edit Assessment | `CreateAssessment.tsx` | `/professor/assessments/:id/edit` | Same component in edit mode |
| Question Bank | `QuestionBank.tsx` | `/professor/questions` | Filterable question grid with bulk select |
| Create Question | `CreateQuestion.tsx` | `/professor/questions/create` | Tabbed form: details, test cases, settings |
| Edit Question | `CreateQuestion.tsx` | `/professor/questions/:id/edit` | Same component in edit mode |
| Leaderboard | `Leaderboard.tsx` | `/professor/leaderboard` | Shared component |
| Notifications | `Notifications.tsx` | `/professor/notifications` | Shared component |

### 4.4 Admin Screens

| Screen | File | Route | Description |
|---|---|---|---|
| Courses | `CourseManagement.tsx` | `/admin/courses` | Default admin landing; course/class CRUD |
| User Management | `UserManagement.tsx` | `/admin/users` | User table with create/edit/delete modals, bulk upload |
| Admin Management | `AdminManagement.tsx` | `/admin/admins` | Admin user management |
| System Health | `SystemHealth.tsx` | `/admin/system-health` | Database, execution, memory, cache status; auto-refresh |
| System Logs | `SystemLogs.tsx` | `/admin/system-logs` | Activity log table with action filters, search |
| Backups | `BackupManagement.tsx` | `/admin/backups` | Backup list with create/restore/download/delete |
| Leaderboard | `Leaderboard.tsx` | `/admin/leaderboard` | Shared component |
| Notifications | `Notifications.tsx` | `/admin/notifications` | Shared component |

### 4.5 Unrouted Screens (on disk, no route)

| Screen | File | Status |
|---|---|---|
| Live Monitor | `LiveMonitor.tsx` | Built but unrouted; real-time proctoring view |
| Analytics | `Analytics.tsx` | Built but unrouted; class/assessment analytics |
| Group Setup | `GroupSetup.tsx` | Built but unrouted; class group management |
| Plagiarism Report | `PlagiarismReport.tsx` | Built but unrouted; similarity comparison view |
| Admin Settings | `AdminSettings.tsx` | Built but unrouted; platform configuration |

---

## 5. Route Structure & Navigation

### 5.1 Route Hierarchy

```
/login                          (public)
/signup                         (public)
/forgot-password                (public)
/reset-password                 (public)
/role-select                    (public, demo)

/student/                       (ProtectedRoute, role=student)
  dashboard
  assessments
  assessments/:id/instructions
  assessments/:id/editor        (outside Layout — full-screen editor)
  assessments/:id/results
  submissions
  leaderboard
  profile
  notifications

/professor/                     (ProtectedRoute, role=professor)
  dashboard
  assessments
  assessments/create
  assessments/:id/edit
  questions
  questions/create
  questions/:id/edit
  leaderboard
  notifications

/admin/                         (ProtectedRoute, role=admin)
  courses                       (default landing)
  users
  admins
  system-health
  system-logs
  backups
  leaderboard
  notifications
```

### 5.2 Sidebar Navigation

Defined in `Layout.tsx`. Each role has a fixed sidebar:

**Student**: Dashboard, Assessments, Submissions, Leaderboard, Profile, Notifications

**Professor**: Dashboard, Assessments, Questions, Leaderboard, Notifications

**Admin**: Courses, User Management, Admins, System Health, System Logs, Backups, Leaderboard, Notifications

### 5.3 Top Bar

- Page title (derived from active sidebar link label)
- Notification bell icon (links to `/{role}/notifications`)
- User avatar (initials) + name + role label

---

## 6. Layout System

### 6.1 Shell Structure

```
┌──────────────────────────────────────────────┐
│ Sidebar (w-64, collapsible to w-20)          │
│ ┌──────────┐ ┌─────────────────────────────┐ │
│ │ Logo     │ │ Top Bar (h-16)              │ │
│ ├──────────┤ ├─────────────────────────────┤ │
│ │ Nav      │ │                             │ │
│ │ links    │ │ Main Content                │ │
│ │          │ │ (overflow-y-auto)           │ │
│ ├──────────┤ │                             │ │
│ │ Collapse │ │                             │ │
│ │ Theme    │ │                             │ │
│ │ Logout   │ │                             │ │
│ └──────────┘ └─────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 6.2 Content Area Patterns

Most screens use: `p-6 md:p-10 max-w-7xl mx-auto space-y-6`

- Page header: title (`text-3xl font-bold`) + description + action buttons
- Filter/toolbar bar: white card with search + filters
- Content: cards, tables, or grids
- Modals: fixed overlay with centered card, `shadow-xl`, `rounded-xl`

---

## 7. Design Conventions

### 7.1 Cards

- Background: `bg-white dark:bg-background-card`
- Border: `border border-slate-200 dark:border-slate-800`
- Radius: `rounded-xl` (never `rounded-2xl`)
- Shadow: `shadow-sm` (never `shadow-lg` or `shadow-2xl`)
- Hover: `hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700`

### 7.2 Buttons

- Primary: `bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-sm`
- Secondary: `border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800`
- Danger: `bg-red-600 hover:bg-red-700 text-white`
- Icon-only: `p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800`
- All buttons: `inline-flex items-center justify-center` (via index.css global rule)

### 7.3 Forms

- Labels: `block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2`
- Inputs: `w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent`
- Spacing: `space-y-4` between fields

### 7.4 Modals

- Overlay: `fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4`
- Card: `bg-white dark:bg-background-card rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800`
- Header: Title + close button row
- Close icon: `material-symbols-outlined` "close"

### 7.5 Status Badges

Status badges use Tailwind color utilities per status. Defined in `utils/formatters.ts`:

| Status | Colors |
|---|---|
| Published/Active | `bg-green-100 text-green-700` (dark: `bg-green-900/20 text-green-400`) |
| Draft | `bg-slate-100 text-slate-600` |
| Completed | `bg-blue-100 text-blue-700` |
| Failed/Rejected | `bg-red-100 text-red-700` |

### 7.6 Icons

- Set: Material Symbols Outlined (variable font)
- Default settings: `FILL 0, wght 400, GRAD 0, opsz 24`
- Filled variant: class `filled` → `FILL 1` (used for active sidebar links)
- Sizing: `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px), `text-3xl` (30px), `text-4xl` (36px)
- Decorative icons should have `aria-hidden="true"`

### 7.7 Shadows (hierarchy)

| Usage | Class |
|---|---|
| Cards at rest | `shadow-sm` |
| Cards on hover | `shadow-md` |
| Modals | `shadow-xl` |
| Never used | `shadow-lg`, `shadow-2xl` |
| Never used | Colored shadows (`shadow-primary/20`) |

### 7.8 Transitions

Scoped via index.css to interactive elements only:

```css
a, button, input, select, textarea,
[class*="hover:"], [class*="transition"] {
  transition-property: color, background-color, border-color, box-shadow, opacity, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
```

No global `*` transition. No bounce, float, shimmer, glow-pulse, or gradient-shift animations.

---

## 8. Accessibility

### 8.1 Implemented

- `aria-label` on all icon-only buttons in Layout (collapse, theme, logout, notifications)
- `aria-expanded` on sidebar collapse toggle
- `aria-hidden="true"` on decorative icons in Layout footer
- `role="dialog"`, `aria-modal`, `aria-labelledby` on ConfirmModal and StudentProfile edit modal
- `:focus-visible` outline: `2px solid #0d8ea5` with `2px offset` (index.css)
- Semantic `<nav>`, `<header>`, `<main>`, `<aside>` elements in Layout
- Form `<label>` elements linked to inputs

### 8.2 Fixed (2026-03-20 hardening plan)

- `role="button"`, `tabIndex={0}`, and Enter/Space keyboard handler added to SubmissionHistory clickable rows
- Escape key close + backdrop click close added to StudentProfile edit/share modals

### 8.3 Fixed (2026-03-20 deep audit)

- `aria-label` added to password show/hide toggle buttons on Login, Signup, ResetPassword ("Show password"/"Hide password")
- `aria-hidden="true"` added to password toggle icon spans
- Session expiry modal in CodeEditor: students mid-assessment see actionable "Session Expired" modal instead of silent 401 failures

### 8.4 Remaining Gaps

- No skip-link implementation
- No focus trap in modals (only escape close on StudentProfile modals so far)
- Sidebar has no ARIA `role="navigation"` region label per section

---

## 9. Responsive Design

### 9.1 Breakpoints

Uses Tailwind default breakpoints:

| Prefix | Min-width | Usage |
|---|---|---|
| (none) | 0px | Mobile-first base styles |
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets / narrow desktop |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Wide desktop |

### 9.2 Responsive Patterns

- **Sidebar**: Always visible; collapses to icon-only (`w-20`) via toggle button (no auto-collapse at breakpoints)
- **Login/Signup**: Split layout (`lg:flex lg:w-1/2`) — left panel hidden below `lg`
- **Content grids**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` or `md:grid-cols-4`
- **Tables**: 12-column CSS grid — no horizontal scroll handling on mobile
- **Top bar profile**: Name/role text hidden below `md` (`hidden md:block`)

### 9.3 Known Gaps

- Sidebar has no responsive auto-collapse — on small screens it occupies full `w-64`
- Data tables (Leaderboard, SystemLogs) don't adapt well below `md` breakpoint
- No mobile hamburger menu or drawer pattern

---

## 10. Dark Mode

### 10.1 Implementation

- Tailwind `darkMode: 'class'` strategy
- Toggle in Layout sidebar footer
- `<body>` receives `dark` class
- Persisted via `localStorage` in AppContext

### 10.2 Color Mapping

| Element | Light | Dark |
|---|---|---|
| Page background | `bg-background-light` (`#f6f8f8`) | `bg-background-dark` (`#101f22`) |
| Card/sidebar | `bg-white` | `bg-background-card` (`#1a2c30`) |
| Text primary | `text-slate-900` | `text-white` |
| Text secondary | `text-slate-500` | `text-slate-400` |
| Borders | `border-slate-200` | `border-slate-800` |
| Hover backgrounds | `hover:bg-slate-50` / `hover:bg-slate-100` | `hover:bg-slate-800` |
| Code editor | Light theme (Monaco default) | Not switched (known gap) |

---

## Appendix: Changes from v1.0 (January 2026)

The original v1.0 UI/UX doc was a pre-development mockup specification. The following significant deviations occurred during implementation:

| Aspect | v1.0 Spec | v2.0 Actual |
|---|---|---|
| Primary color | `#208090` | `#0d8ea5` |
| UI font | Inter | Manrope |
| Code font | Courier New | JetBrains Mono |
| Component library | 20+ documented | 3 shared + inline patterns |
| Design tokens | JSON token system | Tailwind config + defaults |
| Unrouted screens | None planned | 5 built but unrouted |
| Admin landing | Dashboard | CourseManagement |
| Analytics | Comprehensive spec | Unrouted |
| Plagiarism UI | Detailed spec | Unrouted |
| Gradients | Used extensively | Removed (2026-03-20 cleanup) |
| Animations | 12+ custom keyframes | All removed (2026-03-20 cleanup) |
| Admin leaderboard | Not in original | Added (2026-03-20 hardening plan) |
| Form validation | Basic (title/desc only) | Type-specific: coding test cases, MCQ options, date ranges (2026-03-20) |
| Bulk actions | No handlers | QuestionBank bulk visible/hide/delete wired (2026-03-20) |
| Modal a11y | None | Escape close + backdrop click on StudentProfile modals (2026-03-20) |
