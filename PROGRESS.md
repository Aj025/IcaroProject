# PROGRESS — Icaro Projects Frontend

> Living document. Update on every meaningful change. Companion to `PROJECT.md` (the spec),
> `DESIGN.md` (the visual language), and `ARCHITECTURE.md` (the frontend code structure).
> This repo is **frontend-only** — the NestJS backend described in `PROJECT.md` lives in a
> separate repo (not yet created).

**Last updated:** 2026-07-23
**Current pass:** Tailwind v4 migration, feature-sliced refactor, auth/RBAC scaffolding, dashboard grid resize

---

## 1. Overall state

| Dimension | Status |
|---|---|
| Build | ✅ `npm run build` clean |
| Typecheck | ✅ `npm run typecheck` clean (strict mode) |
| Lint | ✅ `npm run lint` — 0 errors, 6 react-refresh warnings (cosmetic; pre-existing) |
| Test suite | ⏳ Not yet added — no test runner configured |
| CI/CD | ⏳ Not yet configured — backend gate per `PROJECT.md` §5 Milestone 1 |
| Backend wired | ❌ No — all data is in-memory seed data; the `supabaseClient` is auth-only |
| Auth wired | ⚠️ Scaffolding only — falls back to demo admin if env vars unset; magic-link form exists but not exercised against a real Supabase project |

---

## 2. Roadmap progress (mirrors PROJECT.md §5)

### Phase 1 — Core MVP

#### Milestone 1 — Infrastructure & Setup

| Task | Status | Notes |
|---|---|---|
| Docker Compose | ❌ | Belongs in backend repo |
| Prisma Schema | ❌ | Belongs in backend repo |
| CI/CD Pipeline | ❌ | Add `.github/workflows/` to whichever repo lands first |
| Auth & RBAC Guard | ⚠️ Frontend scaffolding only — `lib/auth` + `lib/rbac` types + guards; backend `RolesGuard` is the real enforcement |
| Immutable Audit Log | ❌ | Belongs in backend repo |

#### Milestone 2 — Core Business Logic (frontend UI portion)

| Module | Frontend built | Backend needed for |
|---|---|---|
| Tender Register | ✅ | soft-delete guard on `is_signed`, due-soon alert text refinement |
| Supplier Directory | ⚠️ missing merge-duplicates flow | merge endpoint (combine duplicate supplier rows + preserve project links) |
| Project Variations | ⚠️ missing rejection-reason field + locked-delete UI on DocuSign-sent rows | `rejection_reason` DTO field, lock check on sent-to-DS |
| Brain Dump | ⚠️ widget only — no reassign-to-project/user control | assign endpoint |
| Team Permissions | ⚠️ block-removal-when-open-tenders uses a toast message; no formal reassignment flow | reassignment helper |

#### Milestone 3 — Frontend UI

| Screen | Status | Notes |
|---|---|---|
| Dashboard Shell | ✅ | 12-col grid, add/remove/resize widgets, undo-on-delete, collapsible sidebar sections, themed scrollbars |
| Tender Register UI | ✅ | Table + mobile cards + status dropdown + New Tender modal (zod validation) |
| Supplier Directory UI | ✅ | Card grid + trade filter + archive + Add Supplier modal (zod validation) |
| Project View UI — Variations | ✅ | Header + tab bar + table with summary footer |
| Project View UI — other 11 tabs | ⏳ | Tab placeholder only; reuse Variations table pattern when backend data lands |
| Settings UI | ✅ | Company / Integrations / Team & Permissions / Financials sections |

### Phase 2 — External Integrations & Automation

| Task | Status |
|---|---|
| n8n Container | ❌ — Backend repo |
| Xero OAuth Service | ❌ — Backend repo |
| Xero Webhook Handler | ❌ — Backend repo |
| DocuSign API Integration | ❌ — Backend repo |
| Dropbox Read-Only Sync | ❌ — Backend repo |

The Settings → Integrations row UI is built (Xero / Dropbox / DocuSign / Granola) with a "Connect" placeholder button. The actual OAuth flow lives on the backend.

### Phase 3 & 4 — AI & Communications Layer

| Task | Status |
|---|---|
| Claude API Wrapper | ❌ — Backend repo |
| Gmail Tender Parser | ❌ — Backend repo |
| WhatsApp Hub | ❌ — Backend repo |
| AI Data Retention Policy | ❌ — Backend repo |

Dashboard has placeholder slots for these integrations ("Dropbox — recent revisions", "Gmail — draft tenders") — already in the Add Widget drawer, locked until the integration is connected.

---

## 3. Repo structure snapshot

```
src/
├── App.tsx                                                      # Route switch + auth gate
├── main.tsx                                                     # Mounts <ToastProvider><App/></…>
├── index.css                                                    # Tailwind v4 @theme tokens + base + .scroll-themed
├── vite-env.d.ts
├── features/
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── DashboardPage.tsx                                # 12-col grid, add/remove/resize, drag-reorder
│   │   │   ├── AddWidgetDrawer.tsx                             # Right-hand drawer, grouped catalog, lock states
│   │   │   ├── ResizeHandle.tsx                                # 0.25-step corner-drag with live readout
│   │   │   └── widgets.tsx                                      # 11 widget bodies (CashAtRisk, CEOActions, …)
│   │   └── data/
│   │       └── widgetCatalog.ts                                 # Catalog, default layout, grid constants (COL/ROW_STEP, MIN/MAX spans)
│   ├── tenders/
│   │   ├── components/
│   │   │   ├── TenderRegisterPage.tsx
│   │   │   ├── StatusDropdown.tsx
│   │   │   └── NewTenderModal.tsx
│   │   └── data/
│   │       ├── tenders.ts
│   │       └── validation.ts                                    # newTenderSchema (zod)
│   ├── suppliers/
│   │   ├── components/
│   │   │   ├── SuppliersDirectoryPage.tsx
│   │   │   ├── SupplierCard.tsx
│   │   │   └── AddSupplierModal.tsx
│   │   └── data/
│   │       ├── suppliers.ts
│   │       └── validation.ts                                    # supplierSchema (zod)
│   ├── settings/
│   │   ├── components/
│   │   │   ├── SettingsPage.tsx
│   │   │   └── settingsParts.tsx                                # Section, IntegrationRow, MemberRow
│   │   └── data/
│   │       └── settings.ts                                      # Integration, Member, INTEGRATIONS, SEED_MEMBERS
│   └── projects/
│       └── components/
│           ├── ProjectDetailPage.tsx
│           └── projectsParts.tsx                               # ProjectHeader, TabBar, VariationsTab, TabPlaceholder
├── shared/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Pill.tsx, Button.tsx, Input.tsx, Select.tsx,
│   │   │   ├── Modal.tsx, Toast.tsx, Card.tsx
│   │   │   └── index.ts                                         # Barrel
│   │   └── layout/
│   │       ├── AppShell.tsx                                     # Page shell + PageHeader
│   │       └── Sidebar.tsx                                      # Collapsible Project sections
│   ├── data/
│   │   └── projects.ts                                          # Single source of truth (Project, Variation, route parsers)
│   └── lib/
│       └── format.ts                                            # formatDate, daysUntil, formatGBP
└── lib/
    ├── auth/
    │   ├── supabaseClient.ts                                    # Typed singleton (null when env unset)
    │   ├── AuthContext.tsx                                      # <AuthProvider> + useAuth()
    │   └── LoginPage.tsx                                        # Magic-link email form
    └── rbac/
        ├── types.ts                                             # Role, PermissionModule, Permissions
        └── RbacContext.tsx                                      # <RbacProvider> + usePermission(module)
```

Top-level config:
- `package.json` — React 18, Vite 5, TypeScript 5, Tailwind v4 (`@tailwindcss/vite`), zod, lucide-react, `@supabase/supabase-js`
- `vite.config.ts` — `@vitejs/plugin-react` + `@tailwindcss/vite` + `@` path alias to `./src`
- `eslint.config.js` — flat config, hooks plugin
- `tsconfig.app.json` — `strict: true`, `noUnusedLocals: false` (flip to `true` after cleanup pass)
- `index.html` — `<title>Icaro Projects — Dashboard</title>`, `/src/main.tsx` entry, viewport meta
- `.env.example` — `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (env vars for auth)

Docs:
- `PROJECT.md` — client-facing spec (architecture, security tenets, roadmap, decision log)
- `DESIGN.md` — visual language, design tokens, component anatomy, screen specs, implementation notes
- `ARCHITECTURE.md` — frontend module boundaries, Tailwind v4 token system, auth/RBAC flow, security posture
- `PROGRESS.md` — this file

---

## 4. Verification commands

```bash
npm run typecheck   # tsc --noEmit -p tsconfig.app.json
npm run lint        # eslint .
npm run build       # vite build → dist/
```

All three must pass before any commit. The build produces:
- `dist/index.html` — ~0.6 KB
- `dist/assets/index-*.css` — ~24 KB (5.6 KB gzipped)
- `dist/assets/index-*.js` — ~277 KB (82 KB gzipped)

(As of the last verification at 2026-07-23.)

---

## 5. Recent changelog (newest first)

| Date | Change |
|---|---|
| 2026-07-23 | Dashboard grid resize pass: widgets support 0.25-step col/row resize via corner-drag handle. Collapsible Sidebar project sections (Ongoing/Completed/Archive) with auto-expand on active route. Themed scrollbars applied across app (`scroll-themed` utility). Mobile responsiveness improved: grid `auto-rows-auto` on phone. Updated `PROJECT.md` §10, added implementation notes to `DESIGN.md` §8, created this `PROGRESS.md`. |
| 2026-07-23 | Modular refactor pass: migrated flat `src/components/*` to feature-sliced structure (`src/features/{dashboard,tenders,suppliers,settings,projects}` + `src/shared` + `src/lib`). Added Supabase auth scaffolding (magic-link) + RBAC context (`usePermission`, `RequireAuth`, `RequirePermission` guards). Converted all `.jsx/.js` → `.tsx/.ts` with strict prop interfaces. Added zod validation schemas for tender + supplier forms. Wrote new `ARCHITECTURE.md`. |
| 2026-07-23 | Tailwind v3 → v4 migration: dropped `tailwind.config.js`, `postcss.config.js`, `autoprefixer`. Adopted `@tailwindcss/vite` + `@theme` design tokens in `index.css`. All ~1,900 lines of inline `style={{}}` converted to Tailwind utility classes. Deleted the `c` token object. |
| 2026-07-22 | Initial build (per Bolt snapshot) — flat `components/*` layout with shared `shared.jsx` token object and `data/projects.js`. Jackets the visual design described in `DESIGN.md` §1–7. |

---

## 6. Open questions (escalate to Rob / Arjay before building)

These are unresolved and should not be silently answered — per `PROJECT.md` §8 "Ask, Don't Assume".

1. **Persisted dashboard layout** — save per-user in Supabase (`dashboard_layout` table)? Or localStorage? Needs design once backend lands.
2. **Variation rejection reason** — text field only, or do rejection reasons need to be categorised (e.g. "Scope" / "Cost" / "Client Decision")?
3. **Subcontractor portal login** — does it share this frontend, or separate app? Affects auth styling and routing.
4. **WhatsApp outbound replies** — automated to subs (e.g. "insurance expiring") or inbound-only sorting?
5. **Granola plan tier** — if Rob is on Standard, Granola integration (settings row already exists) is skipped.

---

## 7. Next 3 actions (most valuable, smallest blast radius)

1. **Write test scaffold** — add `vitest` + `@testing-library/react` + a smoke test for `<App>` and one widget component. PROJECT.md §7 audit checklist will need test coverage anyway.
2. **Wire `RequirePermission` into Financials section + Financial dashboard widgets** — the RBAC hook exists but isn't yet consumed by feature components. Quick to add once we confirm the permission set matches what Rob wants.
3. **Persist dashboard layout to localStorage** — without backend, this is a one-evening change. Stops the dashboard resetting on refresh and reduces "where did my widgets go" complaints while backend work continues.
