# 🎨 ICARO PROJECTS — Design Reference

> Companion to `PROJECT.md`. This file documents the visual language of the existing build (`localhost:3000`) so new screens can be generated consistently, and flags gaps between what's built and what `PROJECT.md` calls for.
>
> **How to use this file:** feed it to an AI coding/design assistant alongside a description of the new screen you want (e.g. "build the RFIs tab using DESIGN.md"). Token values below are read off the screenshots — if the app has a real Tailwind config / theme file, swap these for the source-of-truth values.

**Source screens audited:** Home Dashboard, Tender Register, Suppliers Directory, Settings, Project Detail → Variations tab
**Last updated:** 2026-07-23 (append-only update after Tailwind v4 migration + dashboard grid resize + collapsible sidebar)

---

## 1. Visual Language, Summary

Dark, low-saturation "site-office at night" theme — near-black forest green base, warm gold accents for money/priority, muted status pills for everything else. Dense, table-heavy, no illustration or decorative imagery. Reads like a finance/ops cockpit, not a marketing product.

---

## 2. Design Tokens

### 2.1 Color

| Token | Approx. value | Usage |
|---|---|---|
| `bg-app` | `#0B1712` | Page background, sidebar |
| `bg-panel` | `#12201A` | Card / widget / table surfaces |
| `bg-panel-hover` | `#182A22` | Row hover, list item hover |
| `bg-input` | `#0F1B15` | Text inputs, search bars |
| `border-subtle` | `rgba(255,255,255,0.08)` | Card borders, table dividers |
| `text-primary` | `#F3F4EF` | Headings, values, primary labels |
| `text-secondary` | `#8FA096` | Sublabels, metadata, timestamps |
| `text-muted` | `#5C6B62` | Placeholder text, disabled |
| `accent-gold` | `#C9A24A` | Primary numbers, active nav, primary buttons, active tab |
| `accent-gold-hover` | `#DBB765` | Button/link hover |
| `status-red` | `#E15554` | Overdue, rejected, high risk |
| `status-orange` | `#E2A33D` | Pending, on-hold, warning dot |
| `status-green` | `#4FAE72` | Approved, used-before, resolved |
| `status-blue` | `#5B8FD9` | Info states — pricing, issued, variation flag |

Status colors are always used as **text-on-tinted-background pills** (≈10–15% opacity fill of the same hue), never solid fills — keep this consistent for any new status badge.

### 2.2 Typography

- Font family: system sans-serif (Inter-class), no serif anywhere.
- Large metric display (e.g. `£54,500`, `£73,580`): bold, ~32–40px, `accent-gold`, tabular numerals.
- Section eyebrow labels (`CASH AT RISK`, `TENDER SNAPSHOT`, `WAITING ON CLIENT`): 11–12px, uppercase, letter-spacing ~0.06em, `text-secondary`.
- Table headers: same eyebrow style, smaller weight.
- Body / list item title: 14–15px, `text-primary`, medium weight.
- Metadata line (client · project · waiting Xd): 12–13px, `text-secondary`, values joined with ` · `.

### 2.3 Spacing & shape

- Card radius: `10–12px`. Button/pill radius: pills fully rounded (`999px`); buttons `6–8px`.
- Card padding: `20–24px`. Grid gutter between dashboard cards: `~20px`.
- Sidebar width: fixed, ~`220px`.
- Borders: 1px hairline, low-opacity white — no drop shadows observed; depth comes from panel color contrast only.

---

## 3. Core Components

### 3.1 Sidebar navigation
Fixed left rail, `bg-app`. Top: circular logo mark + wordmark "ICARO PROJECTS". Flat nav list (Home, Tender Register, Suppliers Directory, Settings). Active item: `accent-gold` text (rest are `text-primary`/white, inactive items don't appear muted — only the active item is gold-highlighted, no visible highlight bg observed beyond text color). Below nav: uppercase eyebrow "PROJECTS" section header, then per-project links indented beneath (e.g. "12 Burtenshaw"), highlighted gold when its detail view is active.

### 3.2 Buttons
- **Primary**: gold fill, dark text, small radius. Used for creation actions — `+ New Tender`, `+ Add Supplier`, `Add member`.
- **Secondary / outline**: transparent or subtle-fill, `text-secondary` → hover `text-primary`. Used for `Connect` in Settings integrations.
- **Text link**: gold or blue, no background — `Mark resolved`, `View all →`, `Add response`, `View response`.

### 3.3 Status pill / badge
Small uppercase text on tinted rounded background. Semantic mapping observed:
- Red: `OVERDUE`, `HIGH RISK`
- Orange: `OUTSTANDING`, `PENDING`, `PROCUREMENT HOLD`, `DUE WITHIN 7 DAYS`
- Green: `APPROVED`, `USED BEFORE`, `ANSWERED`
- Blue: `PRICING`, `ISSUED`, `VARIATION`, `NEW — NOT USED`
- Neutral/olive: `TENDERING`

### 3.4 Card / widget
`bg-panel`, 1px `border-subtle`, radius `10–12px`. Anatomy: eyebrow title top-left, optional integration-source badge top-right (e.g. `↔ Xero`, `↔ DocuSign`, `↔ Dropbox` — small muted pill signaling read-only synced data), body content (metric, list, or mini-table), optional footer total/summary line in `text-secondary`.

### 3.5 Table
Borderless rows separated by 1px hairlines. Eyebrow-style header row. Status/decision column sits far right, sometimes as an editable dropdown (chevron icon, e.g. Tender Register `status` column). Numeric columns right- or left-aligned consistently per table (observed left-aligned here — keep as-is per table, don't mix).

### 3.6 Tabs (project detail)
Horizontal list under the project header. Active tab: `accent-gold` text + gold underline. Inactive: `text-secondary`. Tabs observed: Variations, RFIs, Procurement, Follow-ups, Financials, DocuSign, H&S / Onboarding, Sub Quotes, Sub Orders, Snagging, Meeting Notes, Risk Register.

### 3.7 Project header
Project name (large, `text-primary`) + client name subtitle (`text-secondary`) on the left; total contract value in `accent-gold` top-right. Row of colored status dots beneath the title for high-level health: Programme / Finance / Compliance, each independently orange/green/red.

### 3.8 Checkbox list (CEO Action List)
Square checkbox, small orange dot (priority?) before the item text, item text `text-primary`, trailing metadata + source tag (`— Brain Dump`, `12 Burtenshaw · Brain Dump`) right-aligned in `text-secondary`.

### 3.9 Inputs
`bg-input`, subtle border, placeholder in `text-muted` (e.g. `Search by client or job name...`, `Drop a thought...`, `name@icaroprojects.com`).

---

## 4. Screen Specifications

### 4.1 Home Dashboard (`/`)
Grid of independent widget cards (not a single scroll page of fixed sections — see §5, this becomes a **customizable widget grid**):
1. Cash at Risk — big metric + table (Client, Project, Amount, Overdue, Next Action, Status)
2. CEO Action List — checklist
3. Waiting on Client — list with hold/variation tags + resolve action
4. Outstanding Client Invoices (Xero-sourced) — list + total
5. Outstanding Sub Invoices (Xero-sourced) — list + total, notes CIS deduction
6. Cash Position — net figure + owed-to-Icaro / owed-to-subbies breakdown
7. Tender Snapshot — list + "View all →"
8. DocuSign — Awaiting Signature (DocuSign-sourced) — pending envelope + days-out counter
9. Brain Dump — free-text capture + running list
10. Live Projects — project summary card(s) with risk badge and open-item counts

### 4.2 Tender Register (`/tenders`)
Header row: title + `+ New Tender` primary button. Filter row: search input, status dropdown, "Show Won/Lost" checkbox. Table: Client, Job Description, Received, Due Date (with overdue badge), Contract Sum, Status (editable dropdown pill).

### 4.3 Suppliers Directory (`/suppliers`)
Filter row: search input, trade dropdown, `+ Add Supplier` button. Card grid (not a table) grouped visually by trade eyebrow label (Groundworks, Electrical, Plumbing, Roofing), each card: company name, contact name, phone, email, freeform note, project-used tag, and a `USED BEFORE` / `NEW — NOT USED` status pill.

### 4.4 Settings (`/settings`)
Stacked sections: Company (logo + name), Integrations (Xero, Dropbox, DocuSign, Granola — each a row with name, one-line description, `NOT CONNECTED` status, `Connect` button), Team & Permissions (member rows with per-module checkboxes: Financials, Tenders, Variations, RFIs, Valuations, Risks, Brain Dump, Issue to client; `Preview as` / `Remove` actions; add-member mini form), Financials (below the fold, not captured).

### 4.5 Project Detail → Variations (`/projects/:id/variations`)
Project header (see §3.7) + tab bar (see §3.6). Table (Dropbox-sourced, read-only sync badge): Ref, Description, Value, Submitted, Approval (Pending/Approved pill), Issue Status (Issued/Answered pill + who/when), Actions (`Add response` / `View response`). Footer summary line: Approved / Pending / Rejected totals.

---

## 5. New Feature Spec — Dashboard Widget Management

**This is the primary gap flagged in this pass** (see §6). The dashboard as screenshotted is a fixed set of tiles. `PROJECT.md` Milestone 3 describes the dashboard as a shell of composable widgets, and the platform's whole premise (Xero/DocuSign/Dropbox/Granola integrations feeding cards) implies the tile set should grow as integrations come online — so the dashboard needs to be **user-configurable**, not hardcoded.

### 5.1 Add Widget entry point
- A persistent `+ Add Widget` button sits top-right of the dashboard, in the same header row as the page (visually consistent with `+ New Tender` / `+ Add Supplier` — gold primary button, same corner radius).
- Additionally, an empty dashed-border placeholder card is the last item in the widget grid at all times, labeled `+ Add Widget`, so the action is discoverable even without scrolling to the top.

### 5.2 Add Widget modal/drawer
- Opens a right-hand drawer (or centered modal) titled "Add Widget".
- Widgets are grouped by source module, matching `PROJECT.md`'s module boundaries:
  - **Financials** — Cash at Risk, Cash Position, Outstanding Client Invoices, Outstanding Sub Invoices
  - **Tenders** — Tender Snapshot
  - **Actions** — CEO Action List, Waiting on Client, Brain Dump
  - **Projects** — Live Projects
  - **Integrations** — DocuSign Awaiting Signature (and, once Phase 2/3 land: Dropbox recent revisions, Gmail-parsed draft tenders, WhatsApp project activity)
- Each row: icon, widget name, one-line description, and either an `Add` button (available) or a disabled state.
- **Disabled states:**
  - `Added` — already on the dashboard (idempotent, can't add twice).
  - `Requires <Integration>` — greyed out with a lock icon if the underlying integration is `NOT CONNECTED` in Settings (e.g. a Dropbox-fed widget stays locked until Dropbox shows `Connected`). Clicking it deep-links to `/settings`.
  - Widgets a member's role can't see (per the Team & Permissions module checkboxes in §4.4) simply don't appear in that user's catalog.

### 5.3 Removing a widget
- On hover, every dashboard card shows a small `×` (or `···` overflow menu) in the top-right corner, same position currently used by the integration-source badge — if both are present, source badge sits left of the remove control.
- Click removes the card immediately with an inline `Undo` toast (~5s) rather than a confirmation dialog, since it's a low-stakes, reversible layout action.
- Removed widgets return to the "available" list in the Add Widget drawer.

### 5.4 Persistence & empty state
- Layout is saved per-user (ties into the same account that owns the Team & Permissions role), not global — Rob and Simon can run different dashboards.
- If every widget is removed, show a centered empty state: short line ("Your dashboard is empty") + primary `+ Add Widget` button, rather than a blank page.
- Out of scope for first pass: drag-to-reorder. Note it as a fast-follow, not required to ship the add/remove mechanic.

---

## 6. Gap Check vs `PROJECT.md`

Cross-referencing the five screenshots against the Milestone 2/3 requirements and open questions in `PROJECT.md`. Anything below isn't necessarily broken — most are just not yet visible in the screens captured — but each is worth a deliberate screen/state before Phase 1 sign-off.

| Area | `PROJECT.md` requirement | Seen in screenshots? | Gap to design |
|---|---|---|---|
| Dashboard | Composable widget shell | Fixed tile set, no add/remove control | **Add Widget flow — spec'd above in §5** |
| Tender Register | Delete = soft-delete + restore | No delete/restore control visible in table row actions | Add row-level actions menu (Delete / Restore, with `is_signed` guard messaging) |
| Tender Register | Auto-alert if due date < 3 days | Only a generic red `OVERDUE` badge shown | Needs a distinct "due soon" state (e.g. amber `DUE IN 2D`) separate from overdue |
| Supplier Directory | "Merge" duplicate suppliers, keep project links | Only `+ Add Supplier`, no merge entry point | Add a merge action (bulk-select cards or a dedicated "Merge suppliers" flow) |
| Project Variations | Rejected requires `rejection_reason` | Only Pending/Approved examples shown, no rejection UI | Add a required-reason field to the reject action, and a way to surface that reason on the row |
| Project Variations | Delete locked if sent to DocuSign | No delete control visible | Row actions menu with a disabled/locked delete state + explanatory tooltip |
| Brain Dump | Reassignable to a Project ID or User ID | Widget shows capture + list only, no reassign control | Add an inline "assign to…" control per Brain Dump item |
| Team Permissions | Block member removal if they have open Tenders, force reassignment | `Remove` link has no visible guard/confirmation state | Add a blocked-removal state that lists the open tenders and prompts reassignment |
| Audit Log | Immutable log of financial mutations (who/before/after) | No audit log screen in the captured set | Not required for Phase 1 UI necessarily (could be backend-only), but flag for an Admin-only log viewer if Rob wants visibility |
| Project tabs | RFIs, Procurement, Follow-ups, Financials, DocuSign, H&S/Onboarding, Sub Quotes, Sub Orders, Snagging, Meeting Notes, Risk Register | Tab bar exists; only Variations content was captured | These need their own screen specs — reuse the Variations table pattern (§4.5) as the base template where the data is tabular |
| Settings → Financials | Section exists per the page but cut off in the screenshot | Not fully visible | Re-capture or confirm content before including in this doc |
| Open product decisions | Subcontractor portal login, WhatsApp outbound, Granola plan tier (per `PROJECT.md` §8 "Ask, Don't Assume") | Not decided | Don't design screens for these yet — they're explicitly unresolved; flag to Rob before building |

---

## 7. Notes for Screen Generation

- Reuse §3 components exactly — don't invent new badge colors or button styles per screen; every new status should map onto the existing red/orange/green/blue/gold semantic set.
- New tabular tabs on the project detail view (RFIs, Procurement, etc.) should default to the Variations table layout (§4.5) unless the data genuinely doesn't fit a table.
- Any new dashboard widget must fit the card anatomy in §3.4 and be registered in the Add Widget catalog (§5.2) under the correct module group — don't ship a widget that isn't addable/removable.
- Keep the "synced, read-only" convention (`↔ Xero`, `↔ DocuSign`, `↔ Dropbox`) for any card whose data originates from an external integration rather than direct user entry — it's a load-bearing signal for the user about where edits actually need to happen.

---

## 8. Implementation Notes (2026-07-23 update, additive)

This section **adds** to the original visual spec in §1–7. It documents where the codebase has formalised the tokens/conventions described above and where new components were introduced for the dashboard widget-resize pass.

### 8.1 Design tokens — now CSS-declared, not just documented

The tokens in §2.1 are no longer approximations read off screenshots. They're declared as Tailwind v4 `@theme` custom properties in `src/index.css` and the generated utility classes are the only way to use them:

| Token (§2.1) | CSS variable | Generated utilities |
|---|---|---|
| `bg-app` | `--color-bg-app` | `bg-bg-app`, `text-bg-app`, `border-bg-app` |
| `bg-panel` | `--color-bg-panel` | `bg-bg-panel` (background of every card/widget) |
| `bg-panel-hover` | `--color-bg-panel-hover` | `bg-bg-panel-hover` (row/button hover) |
| `bg-input` | `--color-bg-input` | `bg-bg-input` (all form fields) |
| `border-subtle` | `--color-border-subtle` | `border-border-subtle` |
| `border-strong` | `--color-border-strong` | `border-border-strong` |
| `text-primary/secondary/muted` | `--color-text-*` | `text-text-primary/secondary/muted` |
| `accent-gold` | `--color-gold` | `text-gold`, `bg-gold` (primary buttons) |
| `accent-gold-hover` | `--color-gold-hover` | `bg-gold-hover`, `hover:bg-gold-hover` |
| Dark ink on gold | `--color-gold-ink` | `text-gold-ink` (text on gold buttons — `#241C08`) |
| `status-{red,orange,green,blue}` | `--color-status-*` | `text-status-*`, `bg-status-*` |
| `status-*-bg` (≈14% tint) | `--color-status-*-bg` | `bg-status-*-bg` — used exclusively for pill fills |

**Additional tokens introduced with the resize pass:**
- `--radius-pill` → `rounded-pill` utility (used by every `<Pill>` and status badge — matches §2.3 "pills fully rounded").

Generated utility **conventions** for any new screen:

- Status colors are **always** `text-status-{tone}` over `bg-status-{tone}-bg` — never solid fills. Per §2.1. Enforced by the shared `<Pill>` component (`src/shared/components/ui/Pill.tsx`).
- The `eyebrow` utility class (declared in `@layer utilities` in `index.css`) renders the §2.2 eyebrow label style (11px uppercase letter-spaced) — e.g. used on every card header and section label.

### 8.2 New shared UI primitives (use these, don't re-implement)

Documented in `src/shared/components/ui/`. Replace any ad-hoc inline-styled markup with these:

| Primitive | File | Notes |
|---|---|---|
| `<Pill tone="red\|orange\|green\|blue">` | `Pill.tsx` | Tinted pill — matches §3.3 semantics |
| `<Button variant="primary\|secondary\|ghost" size="sm\|md" icon={…}>` | `Button.tsx` | Primary = gold fill / gold-ink; secondary = outline; ghost = text-only — matches §3.2 |
| `<Input>` / `<Textarea>` / `<Field label error hint>` | `Input.tsx` | `bg-bg-input` + `border-border-subtle`; `Field` wraps a label + optional error/hint — used by every form |
| `<Select>` | `Select.tsx` | Native `<select>` with the dark theme + a chevron overlay |
| `<Modal open title onClose footer>` | `Modal.tsx` | Centered modal scaffold (used by New Tender + Add Supplier forms) |
| `<ToastProvider>` + `useToast()` | `Toast.tsx` | Single undo/info toast provider at app root — consumed by the dashboard, tender, supplier, settings features |
| `<Card>` / `<CardHeader>` | `Card.tsx` | Reusable panel wrapper matching §3.4 anatomy |

### 8.3 Layout scaffolding

`src/shared/components/layout/` exposes:

- `<AppShell>` — wraps every page: composes the `<Sidebar>` with the page body and ensures the dark background + text color + font-size are set globally per page
- `<PageHeader title subtitle actions onOpenMenu>` — the consistent header row with title, subtitle, optional mobile menu button, and right-aligned action slot (e.g. `+ New Tender`)

### 8.4 New: Dashboard widget grid (replaces original fixed tile set)

`PROJECT.md` Milestone 3 + DESIGN.md §5 called for a composable widget shell. The implementation now in `src/features/dashboard/` adds the following:

**Grid model** — `DashboardPage.tsx` renders a 12-column CSS grid on `md+` breakpoints (single-column stack on mobile). Each widget declares its own `gridColumn: span N` and `gridRow: span N` via inline styles, enabling positional placement through CSS auto-flow rather than a JS layout engine.

- **Row height:** `160px` per row (`GRID_ROW_HEIGHT_PX` constant in `widgetCatalog.ts`). On mobile (`<md`), grid uses `auto-rows-auto` so widgets size to content — no forced 160px rows that would feel cramped on small screens.
- **Auto-flow:** `row dense` on desktop so larger widgets backfill gaps left by shorter ones — keeps the grid visually packed.
- **Widget card anatomy:** kept identical to §3.4 — eyebrow title, optional `↔ Xero`/`↔ DocuSign`/`↔ Dropbox` integration badge top-right, hover-revealed `×` for removal. The widget's body now sits in a `flex-1 overflow-y-auto scroll-themed` container so content scrolls cleanly inside the widget when it's larger than its declared `rowSpan`.

**Resize interaction** — each widget has a bottom-right `<CornerDownRight>` handle (revealed on hover). On drag:
- The mouse delta is converted to grid units at a **0.25-step resolution** (`COL_STEP`, `ROW_STEP` in `widgetCatalog.ts`) — each column can be sized in quarter-column increments (about 60–80px) and each row in quarter-row increments (40px). Snapping math in `ResizeHandle.tsx`.
- A **live readout** appears at the corner during the drag, showing `colSpan × rowSpan` (e.g. `4.25 × 1.5`) so the user can place an exact size.
- Spans clamp to `MIN_COL_SPAN = 2`, `MIN_ROW_SPAN = 1`, `MAX_COL_SPAN = 12`, `MAX_ROW_SPAN = 6` (constants in `widgetCatalog.ts`).
- Resize handle is `hidden md:flex` — disabled on mobile per §6 (mobile skips resizing).

**Drag-to-reorder** — original §5.4 called this "fast-follow, not required to ship". It's now wired via the "drag from header" GripVertical icon: re-orders the `widgets` array and lets the grid re-flow. The resize handle's `onMouseDown` calls `stopPropagation` so reordering and resizing never conflict.

**Undo/remove + empty state** — per §5.3 and §5.4: removing a widget shows a 5s `<Toast>` with an `Undo` action; removing every widget shows the centered "Your dashboard is empty" empty state with a `+ Add widget` primary button.

**Persistence** — per §5.4 the layout should ultimately be saved per-user. Today it's in-memory only (state in `DashboardPage`), flagged as a Phase 2 task in `ARCHITECTURE.md` §9 open questions.

### 8.5 New: Collapsible sidebar project sections

`Sidebar.tsx`. PROJECT nav (Home / Tender Register / Suppliers / Settings) stays flat per §3.1. The "Projects" block now:

- Section labels (Ongoing / Completed / Archive) become `<button>` toggles with a `<ChevronDown>` icon
- All sections start **expanded** by default (no seeded collapsed state)
- Clicking the section label flips its collapsed state — the project list below appears/disappears smoothly
- A `useEffect` watches `activeProjectId`: if the user navigates into a project whose section was collapsed, that section auto-expands (prevents disappearing-into-collapsed-section confusion)

### 8.6 New: Themed scrollbars

A new `.scroll-themed` utility (declared in `@layer base` in `index.css`) styles scroll regions to match the dark UI:

- `scrollbar-width: thin` (Firefox)
- `::-webkit-scrollbar` 8px wide with a `--color-text-muted` rounded thumb (no hover state change — the muted tone is intentionally subtle by user choice)
- Applied to: widget body scroll, Add Widget drawer items list, Modal body, Sidebar overflow region

When adding any new `overflow-y-auto` region, append `scroll-themed` to its className so scrollbars match the app theme.

### 8.7 Validated form conventions

Two `zod` schemas land in the relevant feature's `data/validation.ts`:

- `newTenderSchema` — requires 5 fields, accepts only the `TenderStatus` enum for `status`, rejects negative `contractSum` (matches PROJECT.md §7 "Data Validation" audit). Field-level errors surface inline under each input via the `<Field error={…}>` primitive.
- `supplierSchema` — requires `company` + `contact`, validation of email shape, length caps, and optionality rules for `phone`/`email`/`note`. Same `<Field error>` pattern surfaces inline errors.

Both schemas are **additive to the backend DTOs** per PROJECT.md §6 — the server re-validates with `class-validator`. Client validation prevents wasted round-trips and gives inline UX; it is not the security boundary.

### 8.8 Gaps intentionally not addressed this pass

These are still open per §6 Gap Check and remain unstyled/unbuilt:

- **Auth/login page visuals** — a plain login form exists at `/lib/auth/LoginPage.tsx` but no design spec was captured. Re-design against §3.2 button + §3.9 input conventions when the page goes through design review.
- **Audit log viewer** — no UI screen exists; flagged in PROJECT.md §10.4 as a Phase 2 task.
- **Persisted dashboard layout** — §5.4 calls for per-user persistence; in-memory only today. Will need a `dashboard_layout` table on backend + a fetch+save hook on the frontend.
- **Supplier "merge duplicates" flow** — still missing; §6 gap-row stands.
- **Variation "rejection reason" required field** — still missing; §6 gap-row stands.
- **Subcontractor portal + WhatsApp outbound + Granola tier** — unresolved per PROJECT.md §8; don't design screens until Rob confirms.
