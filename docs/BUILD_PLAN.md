# 🏗️ Icaro Projects — Complete Build Plan

> Living document. Check off tasks as they're completed. Companion to `PROJECT.md`, `DESIGN.md`, `ARCHITECTURE.md`, and `PROGRESS.md`.

---

## Foundation & Tooling

- [ ] **Set up test framework** — Add `vitest` + `@testing-library/react` + `happy-dom`. Write smoke tests for `<App>`, `<DashboardPage>`, and one widget component
- [ ] **Configure CI/CD** — Add `.github/workflows/` with `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` on push/PR to `main`
- [ ] **Enable CSP** — Set Content-Security-Policy via vite `define` or `index.html` meta
- [ ] **Add eslint rule** — Block `dangerouslySetInnerHTML` via `no-restricted-syntax`
- [ ] **Create route hook** — Extract hash-routing from `App.tsx` into `src/lib/router/useHashRoute.ts`
- [ ] **Add error boundary** — Wrap each page route in a `<ErrorBoundary>` with fallback UI
- [ ] **Add loading skeleton** — Create shared `<Skeleton>` / `<CardSkeleton>` for async widget states

---

## Auth & RBAC

- [ ] **Complete LoginPage styling** — Redesign magic-link form against DESIGN.md §3.2 (gold primary button) and §3.9 (input conventions). Add loading/error/success states
- [ ] **Wire `RequirePermission` into Dashboard** — Hide Financial widgets (`CashAtRiskWidget`, `CashPositionWidget`, `ClientInvoicesWidget`, `SubInvoicesWidget`) behind `usePermission('Financials')`
- [ ] **Wire `RequirePermission` into Settings** — Conditionally show/hide Financials section in Settings based on `usePermission('Financials')`
- [ ] **Wire `RequirePermission` into Tenders** — Conditionally show `contractSum` column based on estimator role
- [ ] **Wire `RequirePermission` into add-widget drawer** — Filter catalog rows based on user's role permissions
- [ ] **Build "Preview as" role toggle** — Replace placeholder string with a working client-side role-switcher for admins to preview other roles' views

---

## Dashboard

### Widget Grid & Layout

- [ ] **Persist dashboard layout to localStorage** — Save/restore `widgets` array (order, colSpan, rowSpan) to `localStorage` so layout survives refresh
- [ ] **Add "reset layout" action** — Button in dashboard header to restore `DEFAULT_WIDGETS` layout with confirmation toast
- [ ] **Handle fractional resize values** — Ensure resize only produces integer colSpan/rowSpan
- [ ] **Enlarge resize handle hit target** — Verify w-6 h-6 is sufficient for easy grabbing
- [ ] **Fix resize listener lifecycle** — Verify consecutive resizes work without stale listeners

### Missing Widget Data & States

- [ ] **Add per-widget async data hooks** — Create `useWidgetData(id)` hook. Each widget fetches its own data. Show `<WidgetSkeleton>` while loading, `<WidgetEmpty>` when no data, `<WidgetError>` on failure
- [ ] **Cash at Risk widget** — Wire to real data source. Add full table with Client, Project, Amount, Overdue, Next Action, Status columns
- [ ] **Brain Dump widget** — Add "assign to project/user" control per item. Wire to backend CRUD
- [ ] **Waiting on Client widget** — Add "resolve" action per item
- [ ] **Tender Snapshot widget** — Wire to real tender data. Add "View all →" link to `/tenders`
- [ ] **Live Projects widget** — Add open-item counts per project. Wire to real project data

### Add Widget Drawer

- [ ] **Add integration-locked states** — Widgets requiring Dropbox / Gmail stay greyed with lock icon + "Requires Dropbox" until integration is connected in Settings
- [ ] **Deep-link lock icon** — Clicking a locked widget navigates to Settings → Integrations tab
- [ ] **Add RBAC-gated hiding** — Widgets for modules the user doesn't have permission to see are removed from the catalog

### Backend Persistence (post-API)

- [x] **Create `dashboard_layout` table** — Supabase/Postgres table: `user_id`, `layout` (JSON: widget ID, colSpan, rowSpan, position)
- [x] **Add `saveDashboardLayout` / `loadDashboardLayout` hooks** — Fetch/save layout from API on mount and after every resize/add/remove/reorder
- [x] **Server-side validation of layout** — API validates spans are within MIN/MAX bounds before saving

---

## Tender Register

- [ ] **Add delete confirmation guard** — If `is_signed = true`, block deletion with a toast message: "Cannot delete — this tender has been won." Remove from UI until backend guard lands
- [ ] **Add soft-delete row UI** — In the "Deleted Tenders" section, add a permanent "Delete forever" action alongside the existing "Restore"
- [ ] **Add "Due Soon" distinct state** — Differentiate `DUE IN 2D` (amber) from `OVERDUE` (red) — verify against DESIGN.md §6 gap
- [ ] **Add row-level actions menu** — Replace single delete button with a `···` menu: Delete / Restore / Mark won / Mark lost
- [ ] **Add pagination / infinite scroll** — When backend data lands, add pagination for large tender lists
- [ ] **Add tender detail view** — Click a tender row to see full details (scope, documents, timeline)

---

## Suppliers Directory

- [ ] **Build merge-duplicates flow** — Add a "Merge suppliers" action. Flow: select 2+ supplier cards → merge modal → choose primary record → preserve project links
- [ ] **Add trade grouping headers** — Add visual trade group headers (eyebrow style) when filtering is not active
- [ ] **Add supplier detail view** — Click a supplier card to see full profile (all projects worked on, RAMS documents, compliance status)
- [ ] **Add compliance tracking** — RAMS/Method Statement upload date, insurance expiry date, CIS status with coloured warnings
- [ ] **Add bulk archive / restore** — Select multiple suppliers to archive/restore at once

---

## Projects — Remaining 11 Tabs

Current: only Variations tab is built. Each tab below follows the same pattern — reuse VariationsTab table layout where data is tabular.

### RFIs
- [ ] **Build RFIs tab** — Table: RFI number, question, raised by, date, status (Answered/Pending), response. Add "New RFI" form modal
- [ ] **Add response flow** — Answer inline or via modal. Track answered date + responder name

### Procurement
- [ ] **Build Procurement tab** — Table: material/item, supplier, quantity, cost, status (Ordered/Delivered/Installed), delivery date
- [ ] **Add order tracking** — Link to supplier record. Show pending delivery items

### Follow-ups
- [ ] **Build Follow-ups tab** — Checklist items with assignee, due date, status. Reuse CEO Action List pattern

### Financials
- [ ] **Build Financials tab** — Budget vs actual table, valuation summary, payment applications. RBAC-gated (Financials permission)
- [ ] **Add valuation tracking** — List of valuations with status, amount, payment received date

### DocuSign
- [ ] **Build DocuSign tab** — List of sent envelopes, status, recipient, date sent, days outstanding
- [ ] **Add envelope status polling** — Show real-time status while DocuSign processes

### H&S / Onboarding
- [ ] **Build H&S tab** — RAMS document upload list, insurance certificates, method statements. File upload with `.jpg/.png/.heic` validation and <10MB limit
- [ ] **Add compliance checklist** — Status per document type (Uploaded / Missing / Expired)

### Sub Quotes
- [ ] **Build Sub Quotes tab** — Table: trade, subcontractor, quote amount, date received, status. Link to Supplier Directory

### Sub Orders
- [ ] **Build Sub Orders tab** — Table: subcontractor, work description, order value, start/end dates, status. Link to Sub Quotes

### Snagging
- [ ] **Build Snagging tab** — List of snag items: location, description, raised by, date, photo attachment, status (Open/Resolved)
- [ ] **Add photo upload** — Image attachment per snag item with thumbnail preview

### Meeting Notes
- [ ] **Build Meeting Notes tab** — List of meetings: date, title, attendees, notes. Expandable per meeting to show action items
- [ ] **Add action item extraction** — Parse action items with assignee and due date

### Risk Register
- [ ] **Build Risk Register tab** — Table: risk description, category, probability, impact, score (P×I), mitigation, owner, status
- [ ] **Add risk scoring** — Auto-calculate risk score from probability × impact. Colour-code by severity

---

## Settings

### Company
- [ ] **Add logo upload** — Company logo upload with file picker. Store in Supabase storage / S3-compatible
- [ ] **Wire company name save** — Persist company name to backend

### Integrations
- [ ] **Build Xero OAuth connect flow** — "Connect" button triggers OAuth flow. Show "Connected ✓" + "Disconnect" after auth
- [ ] **Build DocuSign OAuth connect flow** — Same pattern as Xero
- [ ] **Build Dropbox OAuth connect flow** — Same pattern
- [ ] **Build Granola connect placeholder** — "Connect" button with tooltip: "Requires Granola Enterprise plan"
- [ ] **Add connection status polling** — Periodically check integration connectivity, show status badge (Connected / Error / Reconnect)

### Team & Permissions
- [ ] **Add "Remove member" guard** — Block removal if user has open Tenders. Show list of open tenders and prompt reassignment before removal
- [ ] **Add member reassignment flow** — When blocking removal, show a modal: "Reassign open tenders to:" with member selector
- [ ] **Persist team members** — Save member list + permissions to backend API
- [ ] **Add invite member flow** — Send invite email via Supabase magic-link

### Financials
- [ ] **Build full Financials settings** — CIS rate, payment terms, VAT number, company bank details. Persist to backend
- [ ] **Add "view audit log"** — Admin-only link to audit log viewer (Phase 2)

---

## Backend API Integration (post-API creation)

- [ ] **Create API client** — `src/lib/api/client.ts` with typed fetch wrapper, auth headers, error handling
- [ ] **Create per-feature API hooks** — `useTendersApi`, `useSuppliersApi`, `useProjectsApi`, `useSettingsApi`, `useDashboardApi`
- [ ] **Add optimistic updates** — On create/update/delete, update UI immediately, rollback on API error
- [ ] **Handle all states** — Every data-fetching component handles: loading, empty, error, stale-while-revalidate
- [ ] **Add request retry** — Retry failed requests (3 attempts with exponential backoff)
- [ ] **Add offline detection** — Detect network loss and show banner: "You're offline. Changes will sync when reconnected."

---

## Polish & Production Readiness

### Performance
- [ ] **Add React.memo to widget bodies** — Prevent unnecessary re-renders during resize/drag
- [ ] **Lazy-load feature pages** — Code-split per route with `React.lazy()` so dashboard loads first
- [ ] **Lazy-load AddWidgetDrawer** — Drawer content loads only when opened
- [ ] **Optimise grid re-renders** — During resize/drag, minimise parent re-renders that cascade to all children
- [ ] **Add bundle analysis** — Run `vite-bundle-visualizer` to identify large dependencies

### UX
- [ ] **Add keyboard navigation** — Sidebar nav items are keyboard-accessible (Tab/Enter). Widget grid supports keyboard reorder
- [ ] **Add focus trapping in modals** — Modal/drawer traps Tab focus, closes on Escape
- [ ] **Add aria labels** — Ensure all interactive elements have `aria-label` or `aria-labelledby`
- [ ] **Add reduced-motion support** — Respect `prefers-reduced-motion` for animations/transitions
- [ ] **Test responsive breakpoints** — Verify every page at: 375px, 768px, 1024px, 1440px, 1920px

### Security (Frontend)
- [ ] **Add CSP headers** — Apply via `vite.config.ts` `define` or `index.html` (backend must also set headers)
- [ ] **Verify no `dangerouslySetInnerHTML`** — Run explicit check across codebase
- [ ] **Verify all user input is text-escaped** — React does this by default, but verify for any edge cases
- [ ] **Add rate-limit awareness** — Handle 429 responses with retry-after UI

### Pre-Launch Audit (PROJECT.md §7)
- [ ] **Data validation** — All form schemas (zod) reject invalid data client-side. Verify every form has a zod schema
- [ ] **Financial privacy** — Tenders with `contractSum` hidden for non-estimator roles (RBAC)
- [ ] **File upload validation** — `.jpg/.png/.heic` only, <10MB (H&S tab)
- [ ] **Audit log integrity** — Verify audit trail for financial mutations (backend responsibility, but verify frontend can display it)

---

## Future Phases (Post-MVP)

### Phase 2 — External Integrations
- [ ] Build Xero data sync UI — Show synced invoices, reconcile status
- [ ] Build DocuSign envelope creation UI — Generate variation PDF, send for signature
- [ ] Build Dropbox revision viewer — Show recently synced drawings in widget + project tab

### Phase 3 — AI & Communications
- [ ] Build Gmail tender parser UI — Show parsed tender drafts, approve/edit before creating
- [ ] Build WhatsApp activity log — Show incoming messages linked to projects
- [ ] Build AI-suggested actions widget — Claude-generated next-step suggestions on dashboard

### Phase 4 — Notes Sync
- [ ] Build Granola notes integration — Display synced meeting notes alongside project timeline
