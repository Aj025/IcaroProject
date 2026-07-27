# ARCHITECTURE — Icaro Projects Frontend

> Companion to `PROJECT.md` (compliance/security authority) and `DESIGN.md` (visual
> language). This document describes the frontend codebase only. Real RBAC, audit
> logging, and integration enforcement live in the NestJS backend per `PROJECT.md` §6.

**Status:** Refactor pass 1 complete (2026-07-23)
**Stack:** React 18 · Vite 5 · TypeScript 5 (strict) · Tailwind CSS v4 · zod · Supabase JS

---

## 1. Module Boundaries

The frontend is sliced by **domain feature**, mirroring the NestJS module boundaries
in `PROJECT.md` §4. Each feature folder is self-contained: its components, data, and
validation live together. Cross-feature primitives live in `shared/`, and any
code touching auth/permissions/routing lives in `lib/`.

```
src/
├── app/                  (planned) — App shell entry, global providers
├── App.tsx               Root component + route switch + auth gate
├── main.tsx              Mounts <App> under <ToastProvider>
├── index.css             Tailwind v4 entry + @theme design tokens
├── vite-env.d.ts         import.meta.env types
├── features/
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── DashboardPage.tsx       Page, widget grid, drag/drop, size toggle
│   │   │   ├── AddWidgetDrawer.tsx      Right-hand drawer, integration-locked rows
│   │   │   └── widgets.tsx             One exported component per widget body
│   │   └── data/
│   │       └── widgetCatalog.ts        Catalog metadata + default layout + sync badges
│   ├── tenders/
│   │   ├── components/
│   │   │   ├── TenderRegisterPage.tsx  Desktop table + mobile cards + deleted section
│   │   │   ├── StatusDropdown.tsx      Inline editable status pill
│   │   │   └── NewTenderModal.tsx      Form with zod validation
│   │   └── data/
│   │       ├── tenders.ts              Tender type, TENDER_STATUSES, SEED_TENDERS
│   │       └── validation.ts           newTenderSchema (zod)
│   ├── suppliers/
│   │   ├── components/
│   │   │   ├── SuppliersDirectoryPage.tsx
│   │   │   ├── SupplierCard.tsx        Active + archived variants
│   │   │   └── AddSupplierModal.tsx    zod validation incl. email + length constraints
│   │   └── data/
│   │       ├── suppliers.ts            Supplier, TRADES, SEED_SUPPLIERS
│   │       └── validation.ts           supplierSchema (zod)
│   ├── settings/
│   │   ├── components/
│   │   │   ├── SettingsPage.tsx        Company / Integrations / Team & Perms / Financials
│   │   │   └── settingsParts.tsx       Section, IntegrationRow, MemberRow
│   │   └── data/
│   │       └── settings.ts             Integration, Member, INTEGRATIONS, SEED_MEMBERS
│   └── projects/
│       └── components/
│           ├── ProjectDetailPage.tsx   Header + tab bar + tab content
│           └── projectsParts.tsx       ProjectHeader, TabBar, VariationsTab, TabPlaceholder
├── shared/
│   ├── components/
│   │   ├── ui/                          Pill, Button, Input, Textarea, Field,
│   │   │                                Select, Modal, Toast, Card (typed primitives)
│   │   │   └── index.ts                 Barrel for `@/shared/components/ui`
│   │   └── layout/
│   │       ├── AppShell.tsx             <Sidebar/> + page body wrapper + <PageHeader/>
│   │       └── Sidebar.tsx              Nav + project sections (consumes shared/data)
│   ├── data/
│   │   └── projects.ts                  Single source of truth: Project, Variation,
│   │                                    PROJECT_TABS, PROJECTS, route parsers
│   └── lib/
│       └── format.ts                    formatDate, daysUntil, formatGBP
└── lib/
    ├── auth/
    │   ├── supabaseClient.ts            Typed singleton (from env) — null when env unset
    │   ├── AuthContext.tsx              <AuthProvider>, useAuth(), demo fallback
    │   └── LoginPage.tsx               Magic-link email form
    └── rbac/
        ├── types.ts                     Role, PermissionModule, Permissions, RbacUser,
        │                                `emptyPermissions`, `fullPermissions`
        └── RbacContext.tsx              <RbacProvider>, useRbac(), usePermission(module)
```

### Why this shape

- **features/** boundaries map 1:1 to the NestJS modules. When the API lands, each
  feature gets a hook that calls its module's endpoints — no other feature imports
  into another feature's folder.
- **shared/** is what genuinely crosses features: primitive UI atoms, project data
  (sidebar + project detail both need it), and format utils.
- **lib/** is anything that touches the whole app: auth, RBAC, routing.

---

## 2. Tailwind v4 + Design Tokens

Tailwind v4 is **CSS-first** — there is no `tailwind.config.js`. All design tokens
are declared as CSS custom properties in the `@theme` block at the top of
`src/index.css`; Tailwind generates utility classes from those custom properties.

### Token inventory (`src/index.css` `@theme`)

| Custom property | Generated utility | DESIGN.md § ref |
|---|---|---|
| `--color-bg-app` | `bg-bg-app` | bg-app |
| `--color-bg-sidebar` | `bg-bg-sidebar` | bg-app (sidebar variant) |
| `--color-bg-panel` | `bg-bg-panel` | bg-panel |
| `--color-bg-panel-hover` | `bg-bg-panel-hover` | bg-panel-hover |
| `--color-bg-input` | `bg-bg-input` | bg-input |
| `--color-border-subtle` | `border-border-subtle` | border-subtle |
| `--color-border-strong` | `border-border-strong` | border-strong |
| `--color-text-primary` | `text-text-primary` | text-primary |
| `--color-text-secondary` | `text-text-secondary` | text-secondary |
| `--color-text-muted` | `text-text-muted` | text-muted |
| `--color-gold` | `text-gold`, `bg-gold` | accent-gold |
| `--color-gold-hover` | `bg-gold-hover` | accent-gold-hover |
| `--color-gold-ink` | `text-gold-ink` | dark text on gold buttons |
| `--color-status-{red,orange,green,blue}` | `text-status-*`, `bg-status-*` | status pills |
| `--color-status-*-bg` | `bg-status-*-bg` | tinted pill fills (14% opacity) |
| `--radius-pill` | `rounded-pill` | fully rounded badges |

### Conventions

- **Status colors are always pill-style** — text-on-tinted-background, never solid
  fills. Per DESIGN.md §2.1, the convention is enforced by the `<Pill tone>` component,
  which composes `bg-status-{tone}-bg` + `text-status-{tone}`.
- The `eyebrow` utility class (11px uppercase letter-spaced label, used on card
  titles and section headers) is declared in `@layer utilities`.
- No inline `style={{}}` remains — all visual styling is utility classes. Two
  exceptions are deliberate: dynamic `borderTop` toggling for first-row suppression
  inside mapped lists (performance-optimal vs re-rendering class strings).
- The previous `c` token object in `shared.jsx` has been deleted.

### Removed Tailwind v3 plumbing

- `tailwind.config.js` — deleted (CSS-first config replaces it)
- `postcss.config.js` — deleted (v4 ships with `@tailwindcss/vite`)
- `autoprefixer` package — removed (v4 plugins handle vendor prefixes)
- `@tailwind base/components/utilities` directives → `@import "tailwindcss"`

---

## 3. Auth + RBAC Flow

### Why scaffolding, not enforcement

`PROJECT.md` §6 is explicit: **"Never trust the frontend. RBAC enforced server-side
on every endpoint."** Everything here is a **defense-in-depth** UX layer — the
source of truth lives in the NestJS backend. The frontend's job is to:

1. Obtain a Supabase session (magic-link OTP)
2. Read role + permission flags from the session's `user_metadata`
3. Hide/disabled UI the user can't use
4. Redirect unauthenticated users to `/login`

The backend still re-validates every request against its own RBAC.

### Data flow

```
Supabase Auth ─┐
               ├─> AuthContext (session, user, loading)
               │      │
               │      └─> RbacContext (role, permissions, can(), isAdmin())
               │             │
               │             ├─> usePermission(module) — used inside feature components
               │             └─> RequirePermission module="Financials" — route guards
               │
               └─> App.tsx — if !user && isAuthEnabled → <LoginPage/>
```

### Env wiring

`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (see `.env.example`). If both are
unset the app runs in **demo mode**: `supabaseClient` exports `null`, `AuthProvider`
synthesises a demo admin user. This is intentional for local UI work without a
backend, but explicit `console.warn` fires so it's never silent.

### RBAC types (`src/lib/rbac/types.ts`)

```ts
export type Role = 'admin' | 'estimator' | 'pm';

export const PERMISSION_MODULES = [
  'Financials', 'Tenders', 'Variations', 'RFIs',
  'Valuations', 'Risks', 'Brain Dump', 'Issue to client',
] as const;

export type Permissions = Record<PermissionModule, boolean>;
```

The Settings → Team & Permissions page writes `permissions` into `user_metadata`
via Supabase (when backend is wired). For now it stays in component state, but the
shape matches what `RbacContext.deriveUser` reads.

### Guards available

- `RequireAuth` — renders `fallback` if no session (used implicitly in `App.tsx`)
- `RequirePermission module="Financials"` — wraps a node, renders `fallback` (or
  `null`) if the current user's permissions flag is false

These composable guards are exported from `src/lib/rbac/` for any future route
needing conditional rendering.

---

## 4. Validation Strategy

Forms use **zod schemas** declared per-feature in `data/validation.ts`. The schemas
mirror `PROJECT.md`'s `class-validator` DTO rules where applicable:

- `newTenderSchema` rejects negative `contractSum` (PROJECT.md §7 "Data Validation"),
  requires all 5 fields, constrains `status` to the closed enum
- `supplierSchema` validates email shape, caps string lengths, makes `phone`/
    `email`/`note` optional-but-trimmed

Schemas are *additive* — the backend DTOs remain authoritative. Client validation
prevents wasted round-trips and gives inline errors; backend validation is the
security boundary.

---

## 5. Frontend Security Posture

### What's enforced now

| Concern | State |
|---|---|
| Authentication | Supabase magic-link via `AuthProvider`, gated in `App.tsx` |
| Session | Held by Supabase client; auto-refresh via `onAuthStateChange` |
| Role-based UI hiding | `usePermission(module)` consumed by feature components (TODO: wire into Dashboard widgets + Settings sections) |
| Input validation | zod schemas at form submit; matches backend DTO rules |
| Negative-value guard | `Tender.contractSum >= 0` enforced by `newTenderSchema` |
| XSS | No `dangerouslySetInnerHTML` anywhere; all user input rendered as text content (React escapes by default) |
| Tokens at rest | N/A on frontend — Supabase manages refresh tokens; never stored manually |
| Soft delete / restore | UI surfaces soft-delete + undo via `Toast` action; backend enforces `is_deleted` per `PROJECT.md` §9 decision log |

### Known open gaps (deferred to backend)

- No CSRF token handling — no cookies are used by the frontend (Supabase uses
  `localStorage` session). Backend CSRF middleware is the responsibility of NestJS.
- No file upload validation (`.jpg`, `.png`, `.heic`, <10MB) — not yet built;
  `PROJECT.md` §7 checklist calls this out for the Snagging module.
- Audit log viewer — `PROJECT.md` §6 requires an immutable `AuditLog` table on the
  backend. The Admin-only audit viewer UI is **not built** in this pass — flag for
  Phase 2 once backend is live.

### Hardening to add before production

1. Add eslint rule `no-restricted-syntax` blocking `dangerouslySetInnerHTML`
2. Set CSP via `vite.config.ts` `define` or via a meta tag in `index.html`
   — frontend cannot fully enforce CSP, the backend must add headers.
3. Wire `RequirePermission` into Financials section + Financial dashboard widgets
   so members without `Financials` permission don't see them.

---

## 6. Routing

Single `App.tsx` switches on `window.location.hash` (no router dependency yet).
Routes:

- `/`                  → DashboardPage
- `/tenders`           → TenderRegisterPage
- `/suppliers`         → SuppliersDirectoryPage
- `/settings`          → SettingsPage
- `/projects/:id/:tab` → ProjectDetailPage (matched via `parseProjectRoute`)
- (any other)          → DashboardPage (fallback)

`useHashRoute` hook (planned in `src/lib/router/`) replaces the inline `useState`
hash logic. Current App keeps the hash-change subscription inline; once route guards
or nested routes land, switch to `react-router` or a typed custom hook.

---

## 7. Decision Log (this refactor pass)

| Date | Decision |
|---|---|
| 2026-07-23 | Tailwind v3 → v4 (CSS-first `@theme`). Driven by v4's atomic CSS being a better fit for design-token-driven UIs. |
| 2026-07-23 | `.jsx` → `.tsx` project-wide. Matches `tsconfig.app.json` `strict: true` and PROJECT.md §1 "Code Best Practices". |
| 2026-07-23 | Adopted **feature-sliced** structure over flat layers. Maps 1:1 to PROJECT.md §4 NestJS modules. Let each feature add a hook when the API lands. |
| 2026-07-23 | Auth = Supabase magic-link (not password). Supabase was already a dependency; magic links carry less risk than password flows (no user-chosen weak passwords to leak). |
| 2026-07-23 | RBAC stays UX-only on the frontend; backend remains the enforcement boundary. PROJECT.md §6 is explicit; don't pretend otherwise. |
| 2026-07-23 | Added `zod` for form validation. Mirrors the backend's `class-validator` rules client-side for inline errors. |
| 2026-07-23 | Deleted `optimizeDeps.exclude: ['lucide-react']` — workaround for an old Vite bug no longer relevant on v5 + 0.3x lucide. |
| 2026-07-23 | Removed stale `/vite.svg` favicon reference from `index.html` (file never existed). |

---

## 8. Quick Reference — Adding a New Feature

1. Create `src/features/<name>/` with `components/`, `data/`, `hooks/` (if needed),
   `types.ts` (if types are reusable across files)
2. Add a `data/validation.ts` if there are forms — schema declared with zod
3. Render through `<AppShell>` (consumes `Sidebar`) + `<PageHeader>`
4. Use only UI primitives from `@/shared/components/ui` — no inline styles
5. If feature is permission-gated, consume `usePermission('Financials')` and
   wrap sensitive sections in `<RequirePermission module="Financials">`
6. Add the route in `App.tsx` (hash-route switch)

---

## 9. Open Questions (Ask, Don't Assume)

These are **frontend gaps** flagged for Rob/Arjay to resolve before Phase 2:

- **Persisted dashboard layout** — saved per-user (DESIGN.md §5.4). Currently
  in-memory `useState`; needs a Supabase `dashboard_layout` table + hook.
- **Subcontractor portal** — still undecided in `PROJECT.md` §8. Affects whether
  a second Supabase auth role is needed.
- **Preview-as role** — Settings → "Preview as" is a placeholder string today.
  Needs an actual session-impersonation flow (Supabase secure admin endpoints)
  or a read-only client-side toggle.
- **Async widgets** — every dashboard widget is synchronous seed data today. When
  Xero/Dropbox/Dropbox integrations land, each widget should become a hook that
  fetches its own data and shows a loading/empty/error state.

Per `PROJECT.md` §8: flag, don't silently answer.
