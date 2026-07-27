# Dashboard Layout Module — Backend Specification

> Target: NestJS + PostgreSQL 16 + Prisma ORM
> Frontend: `src/features/dashboard/`
> See also: `PROJECT.md` §4 (module structure), §5 (roadmap), §6 (RBAC rules), `ARCHITECTURE.md` §9 (open questions — persisted layout)

> **Implementation deltas (2026-07-27):** This spec was implemented with the
> following deviations, applied to match existing backend conventions.
> See `docs/API.md` for the authoritative endpoint reference.
>
> | Spec says | Implemented as | Reason |
> |---|---|---|
> | `PUT /api/dashboard/layout` | **`PATCH /dashboard/layout`** | `main.ts` CORS allow-list omits `PUT`; other modules use `/tenders`, `/suppliers` (no `/api` prefix and no `PUT`). |
> | tenantId sourced from JWT | **`process.env.TENANT_ID ?? 'default'`** | The Supabase JWT payload is only `{ sub, email }`. Existing suppliers/dropbox modules use the same env convention. |
> | `forwardRef(() => AuditLogModule)` import | **inline `this.db.auditLog.create(...)`** | No `AuditLogModule` exists; tenders and suppliers both write audit logs inline. |
> | route prefix `/api/dashboard/layout` | **`/dashboard/layout`** | No `/api` global prefix is set in `main.ts`. |

---

## 1. Database Schema (Prisma)

```prisma
model DashboardLayout {
  id        String   @id @default(cuid())
  tenantId  String
  userId    String

  widgets   Json     // WidgetInstance[] — see §1.1 for shape
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([tenantId, userId])
  @@index([tenantId])
  @@map("dashboard_layouts")
}
```

### 1.1 JSON shape of `widgets`

```typescript
interface WidgetInstance {
  id: string;
  colSpan: number;   // 2–12, step 1 (rounded from 0.25 snap)
  rowSpan: number;   // 1–6, step 1
}
```

Stored example:

```json
[
  { "id": "cash-at-risk", "colSpan": 4, "rowSpan": 2 },
  { "id": "ceo-actions", "colSpan": 4, "rowSpan": 2 },
  { "id": "waiting-client", "colSpan": 4, "rowSpan": 1 },
  { "id": "client-invoices", "colSpan": 4, "rowSpan": 2 },
  { "id": "brain-dump", "colSpan": 4, "rowSpan": 2 },
  { "id": "live-projects", "colSpan": 8, "rowSpan": 2 }
]
```

### 1.2 Design decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Storage** | JSON column (not separate rows per widget) | Widget list is inherently ordered; saves/loads are atomic. No relational joins needed. |
| **One row per user** | `@@unique([tenantId, userId])` | Upsert pattern: one row always exists per user after first save. |
| **Single layout for all breakpoints** | Yes (MVP) | Frontend CSS grid already handles responsive: `grid-cols-1` on mobile stacks widgets vertically ignoring spans, `grid-cols-12` on desktop applies spans. Same data works everywhere. |
| **Future: separate mobile/desktop layouts** | Schema-compatible via `variant` column | If needed later, add `variant enum('desktop','mobile')` to the unique constraint. Not needed for MVP. |

### 1.3 Field mapping: Frontend → Backend

| Frontend (`WidgetInstance[]`) | Backend (`widgets` JSON) | Notes |
|---|---|---|
| `[].id` | `[].id` | Must match a known `WIDGET_CATALOG` entry |
| `[].colSpan` | `[].colSpan` | Clamped to `[2, 12]` server-side |
| `[].rowSpan` | `[].rowSpan` | Clamped to `[1, 6]` server-side |
| Array order | Array order | Determines visual position in `grid-auto-flow: dense` layout |

### 1.4 Frontend widget catalog constants (for server-side validation)

The server must mirror these bounds from `src/features/dashboard/data/widgetCatalog.ts`:

| Constant | Value |
|---|---|
| `MIN_COL_SPAN` | 2 |
| `MAX_COL_SPAN` | 12 |
| `MIN_ROW_SPAN` | 1 |
| `MAX_ROW_SPAN` | 6 |
| `DEFAULT_COL_SPAN` | 4 |
| `DEFAULT_ROW_SPAN` | 1 |
| Max widgets per layout | 20 (hard limit, not a frontend constant) |

Valid widget IDs (derived from `WIDGET_CATALOG`):

```
cash-at-risk, cash-position, client-invoices, sub-invoices,
ceo-actions, waiting-client, brain-dump,
tender-snapshot, live-projects,
docusign, dropbox-revisions, gmail-tenders
```

---

## 2. API Endpoints

Base path: `/api/dashboard/layout`
Auth: `@UseGuards(AuthGuard)` on all.
RBAC: All authenticated users can R/W their own layout (see §5).

### 2.1 Get layout

#### `GET /api/dashboard/layout`

Returns the current user's widget layout. If no saved layout exists, returns the server-defined default layout.

**Response `200 OK`:**

```json
{
  "widgets": [
    { "id": "cash-at-risk", "colSpan": 4, "rowSpan": 2 },
    { "id": "ceo-actions", "colSpan": 4, "rowSpan": 2 }
  ]
}
```

**Edge cases:**
- No layout saved yet → return `DEFAULT_WIDGETS` from server (mirrors `src/features/dashboard/data/widgetCatalog.ts`). Do NOT auto-create a DB row — wait until first save.
- Unknown widget IDs in stored layout → strip them silently; log a warning.
- Empty widgets array → treat as "no layout" → return defaults.

**Default layout (server constant, mirrors frontend):**

```json
{
  "widgets": [
    { "id": "cash-at-risk", "colSpan": 4, "rowSpan": 2 },
    { "id": "ceo-actions", "colSpan": 4, "rowSpan": 2 },
    { "id": "waiting-client", "colSpan": 4, "rowSpan": 1 },
    { "id": "client-invoices", "colSpan": 4, "rowSpan": 2 },
    { "id": "sub-invoices", "colSpan": 4, "rowSpan": 2 },
    { "id": "cash-position", "colSpan": 4, "rowSpan": 1 },
    { "id": "tender-snapshot", "colSpan": 4, "rowSpan": 1 },
    { "id": "docusign", "colSpan": 4, "rowSpan": 1 },
    { "id": "brain-dump", "colSpan": 4, "rowSpan": 2 },
    { "id": "live-projects", "colSpan": 8, "rowSpan": 2 }
  ]
}
```

### 2.2 Save layout

#### `PUT /api/dashboard/layout`

Create or replace the current user's layout (upsert semantics).

**Request body:**

```json
{
  "widgets": [
    { "id": "cash-at-risk", "colSpan": 6, "rowSpan": 2 },
    { "id": "ceo-actions", "colSpan": 6, "rowSpan": 1 }
  ]
}
```

**Validation (class-validator DTO):**

| Field | Rules |
|---|---|
| `widgets` | Required. `@IsArray()`. Max 20 items. |
| `widgets[].id` | Required. `@IsString()`. Must be a known widget ID from the catalog. |
| `widgets[].colSpan` | Required. `@IsInt()`, `@Min(2)`, `@Max(12)`. |
| `widgets[].rowSpan` | Required. `@IsInt()`, `@Min(1)`, `@Max(6)`. |
| Duplicate IDs | Reject with `400`: `{ message: "Duplicate widget IDs are not allowed", duplicates: ["cash-at-risk"] }`. |

**Response:** `200 OK` with saved layout.

```json
{
  "widgets": [
    { "id": "cash-at-risk", "colSpan": 6, "rowSpan": 2 },
    { "id": "ceo-actions", "colSpan": 6, "rowSpan": 1 }
  ]
}
```

**Edge cases:**
- If any widget ID is unrecognised → `400` with `{ message: "Unknown widget IDs", unknownIds: ["bad-id"] }`.
- If all widgets removed (empty array) → allowed. Frontend shows empty state. Next `GET` returns the empty layout (not defaults).

### 2.3 Reset layout

#### `POST /api/dashboard/layout/reset`

Deletes the user's saved layout row. Subsequent `GET` calls return the server default.

**RBAC:** `@Roles(Role.Admin)` — prevents accidental resets by non-admin users. (PMs and Estimators who want to reset can remove widgets individually via the UI.)

**Response:** `200 OK`

```json
{
  "widgets": [
    { "id": "cash-at-risk", "colSpan": 4, "rowSpan": 2 },
    { "id": "ceo-actions", "colSpan": 4, "rowSpan": 2 }
  ],
  "reset": true,
  "message": "Layout reset to defaults"
}
```

**Edge cases:**
- No saved layout exists → return defaults with `reset: true`, no-op on DB.

---

## 3. Mobile ↔ Desktop Strategy

### 3.1 Why a single layout works

The frontend's CSS grid is inherently responsive:

| Breakpoint | Grid definition | How widget spans behave |
|---|---|---|
| `< 768px` (mobile) | `grid-cols-1`, `auto-rows-auto` | All widgets stack vertically. `colSpan`/`rowSpan` are ignored by CSS. Widgets size to their content height. |
| `>= 768px` (desktop) | `grid-cols-12`, `auto-rows: minmax(160px, auto)` | `colSpan`/`rowSpan` are applied. Widgets arrange in the 12-column grid with row-dense packing. |

Since the same `[colSpan, rowSpan]` values are harmless on mobile (CSS ignores them), **one layout set works for both**. The user adds/reorders/resizes on desktop; the same order applies on mobile as a vertical stack.

### 3.2 What this means for the backend

- No need to store two layout variants.
- No need to detect device type on the server.
- The layout JSON is device-agnostic — the frontend decides how to render it.

### 3.3 Future: responsive-aware layouts

If a user wants a completely different widget set on mobile (e.g. hide financials on phone), add a `variant` column later:

```prisma
enum LayoutVariant {
  DESKTOP
  MOBILE
}

model DashboardLayout {
  ...
  variant   LayoutVariant @default(DESKTOP)
  @@unique([tenantId, userId, variant])
}
```

The frontend then saves/loads the variant matching its current viewport. **Not needed for MVP.**

---

## 4. Business Rules & Edge Cases

### 4.1 Server-side span validation

Even though the frontend clamps spans client-side, the server must re-validate:

```ts
// In LayoutDto validation
@ArrayMaxSize(20)
@ValidateNested({ each: true })
@Type(() => WidgetItemDto)
widgets: WidgetItemDto[];

class WidgetItemDto {
  @IsString()
  @IsIn(WIDGET_CATALOG_IDS)   // hardcoded list of valid IDs
  id: string;

  @IsInt()
  @Min(2)
  @Max(12)
  colSpan: number;

  @IsInt()
  @Min(1)
  @Max(6)
  rowSpan: number;
}
```

### 4.2 Unknown widget IDs in stored data

On `GET`, if a stored layout references widget IDs that no longer exist in the catalog (e.g. after a software update removes a widget):

1. Strip unknown entries from the array.
2. Log a warning: `Layout for user {userId} contained unknown widget IDs: [bad-id-1]`.
3. Return the cleaned array.
4. If the array is empty after stripping, return defaults.

### 4.3 Empty layout

- User intentionally removes all widgets → `widgets: []` is saved as-is.
- `GET` returns `{ widgets: [] }`.
- Frontend shows the empty state ("Your dashboard is empty").

### 4.4 Rate limiting

- Max 30 layout saves per minute per user. Prevents abuse from rapid resize spam.

### 4.5 Multi-tenancy

- Every layout is scoped by `tenantId` (extracted from the auth JWT).
- Two different tenants can have the same `userId` value without collision — the `@@unique([tenantId, userId])` constraint handles this.

### 4.6 Concurrent save conflicts

Use an optimistic approach:
- The frontend sends the full widget array on every save.
- Last write wins. No version/ETag needed for MVP — the widget list is small (< 20 items) and saves are infrequent (debounced).

---

## 5. RBAC Matrix

| Endpoint | Admin | Estimator | PM |
|---|---|---|---|
| `GET /api/dashboard/layout` | ✅ | ✅ | ✅ |
| `PUT /api/dashboard/layout` | ✅ | ✅ | ✅ |
| `POST /api/dashboard/layout/reset` | ✅ | ❌ | ❌ |

All authenticated users can save and load their own layout. The reset action is admin-only to prevent accidental loss of customisation by team members.

---

## 6. Module Structure (NestJS)

```
src/modules/dashboard/
├── dashboard.module.ts
├── dashboard.controller.ts
├── dashboard.service.ts
├── dto/
│   ├── save-layout.dto.ts          # WidgetItemDto[] + validation
│   └── layout-response.dto.ts      # Response shape
├── dashboard.repository.ts
└── constants/
    └── default-layout.ts           # DEFAULT_WIDGETS constant matching frontend
```

### Module dependencies

| Import | Purpose |
|---|---|
| `PrismaModule` | Database access via `PrismaService` |
| `AuthModule` | `AuthGuard` for JWT validation |
| `forwardRef(() => AuditLogModule)` | Audit logging (async, fire-and-forget) |

---

## 7. Audit Log Events

| Event | Trigger | Details |
|---|---|---|
| `DASHBOARD_LAYOUT_SAVED` | `PUT /api/dashboard/layout` | `after: { widgetCount: widgets.length }` |
| `DASHBOARD_LAYOUT_RESET` | `POST /api/dashboard/layout/reset` | `before: { widgetCount: previous.length }` — only if a saved layout existed |

Audit logs do NOT store the full widget array — only the count. The layout JSON is PII-light, but the full payload would bloat the audit log unnecessarily.

---

## 8. Frontend Integration Notes

These are guidelines for the frontend implementation when the API goes live.

### 8.1 `useDashboardLayout()` hook

```typescript
interface UseDashboardLayoutReturn {
  widgets: WidgetInstance[];
  loading: boolean;
  error: Error | null;
  saveLayout: (widgets: WidgetInstance[]) => Promise<void>;
  resetLayout: () => Promise<void>;
}
```

- **On mount:** `GET /api/dashboard/layout` → hydrate `widgets` state.
- **On change (debounced):** After 1.5s of no resize/add/remove/reorder activity, call `PUT /api/dashboard/layout` with current array.
- **Optimistic:** Update UI immediately on add/remove/resize; revert on API error with a toast.
- **Reset:** `POST /api/dashboard/layout/reset` → replace local state with returned defaults.

### 8.2 Debounce logic

```typescript
// WidgetManager.tsx (conceptual)
const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

function scheduleSave(widgets: WidgetInstance[]) {
  clearTimeout(saveTimeoutRef.current);
  saveTimeoutRef.current = setTimeout(() => {
    api.put('/dashboard/layout', { widgets });
  }, 1500); // 1.5s quiet period
}
```

### 8.3 Loading state

- Show a skeleton grid while `GET` is in-flight.
- After first successful load, cache the layout in `localStorage` as fallback for subsequent renders while the API re-fetches.

### 8.4 Error handling

| Scenario | Behaviour |
|---|---|
| `GET` fails (network) | Fall back to `localStorage` cache. Show toast: "Couldn't load your saved layout — using cached version." |
| `PUT` fails (network) | Keep optimistic state. Toast: "Layout not saved — will retry." Retry on next change. |
| `PUT` fails (validation) | Revert optimistic update. Toast: "Couldn't save layout — some widgets were removed." |
| `PUT` 429 (rate limit) | Show toast: "Saving too quickly — slowing down." Re-queue save after 3s. |

---

## 9. Key Dependencies (Backend)

| Package | Purpose |
|---|---|
| `@prisma/client` | Database ORM |
| `class-validator` + `class-transformer` | DTO validation (widget IDs, span bounds) |
| `@nestjs/passport` | JWT auth extraction (userId, tenantId) |
| `@nestjs/throttler` | Rate limiting for save endpoint |

---

## 10. Open Questions

- **Granularity of reset:** Should reset only be admin-only (as spec'd in §5)? Or should any user be able to reset their own layout? Decision: admin-only for MVP to prevent accidents. Revisit if users request self-service reset.
- **Cache invalidation:** If widgets are added/removed from the catalog in a future deployment, stale layouts silently drop unknown IDs (§4.2). Do we need to notify the user? For MVP, silent stripping is fine — the frontend will show fewer widgets without error.
