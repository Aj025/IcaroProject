# Icaro Projects API

**Base URL:** `http://localhost:3000`
**Swagger UI:** `http://localhost:3000/docs`

---

## How to Run

### Prerequisites
- Node.js 20+
- PostgreSQL 16 (or Docker)
- `.env` file from `.env.example`

### Option 1 — Local

```bash
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

### Option 2 — Docker

```bash
docker compose up --build
```

Postgres 16 + API (port 3000) + n8n (port 5678) all spin up.

---

## Authentication

All Tenders endpoints require a **Bearer JWT** header.

```
Authorization: Bearer <jwt>
```

The server accepts JWTs signed with either `JWT_SECRET` (local login) or `SUPABASE_JWT_SECRET` (Supabase Auth). Tokens are verified via HS256. Role and permissions are fetched fresh from the `Profile` DB table on every request — never from the JWT itself.

### Register

```
POST /auth/register
```

```json
{
  "email": "user@example.com",
  "password": "min-8-chars",
  "fullName": "Jane Doe"
}
```

- `email` — required
- `password` — required, min 8 characters
- `fullName` — optional

Creates a profile with `role: "estimator"` and `permissions: []`. To promote to admin, update the DB directly.

**Response (201):**
```json
{
  "access_token": "<jwt>"
}
```

### Login

```
POST /auth/login
```

```json
{
  "email": "rob@icaroprojects.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "access_token": "<jwt>"
}
```

### Required Permission: `Tenders`

The `PermissionsGuard` checks that the authenticated user's profile has `Tenders: true` in their `permissions` JSON field. Endpoints return **403 Forbidden** if missing.

---

## Endpoints

### Health

| Method | Path        | Auth  | Description                              |
|--------|-------------|-------|------------------------------------------|
| GET    | `/`         | No    | Service info (name + version)            |
| GET    | `/health`   | No    | Server health check                      |
| GET    | `/docs`     | No    | Swagger/OpenAPI documentation UI         |

**GET / — Response (200):**
```json
{
  "service": "Icaro Projects API",
  "version": "1.0"
}
```

---

### Tenders CRUD

All require `Authorization: Bearer <jwt>` + `Tenders` permission.

#### `POST /tenders`
Create a new tender.

```json
{
  "client": "Acme Corp",
  "job": "Foundation pour",
  "received": "2026-07-25T00:00:00.000Z",
  "due": "2026-08-15T00:00:00.000Z",
  "status": "Pricing",
  "contractSum": 50000,
  "email": "client@acme.com",
  "sourceEmailId": "abc123"
}
```

- `status`: optional, defaults to `Pricing`. Enums: `Pricing`, `Tendering`, `Issued`, `Won`, `Lost`, `Withdrawn`
- `contractSum`: optional, >= 0
- `email`: optional string — client contact email
- `sourceEmailId`: optional string — Gmail message ID for deduplication. Returns **409 Conflict** if already exists.
- `createdById`: auto-set from authenticated user

**Response (201):** `TenderResponseDto`

---

#### `GET /tenders`
List tenders with optional filters.

| Query          | Type    | Description                         |
|----------------|---------|-------------------------------------|
| `status`       | string  | Filter by TenderStatus              |
| `search`       | string  | Search client or job                |
| `includeDeleted` | bool | Include soft-deleted tenders        |

**Response (200):** `TenderResponseDto[]`

---

#### `GET /tenders/snapshot`
Dashboard snapshot — first 10 non-deleted tenders ordered by `due` ascending, with computed `overdue` and `dueSoon` flags.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "client": "Acme Corp",
    "job": "Foundation pour",
    "due": "2026-08-15T00:00:00.000Z",
    "status": "Pricing",
    "contractSum": null,
    "isSigned": false,
    "overdue": false,
    "dueSoon": true
  }
]
```

- `overdue`: `true` if `due` is before now
- `dueSoon`: `true` if `due` is within 2 days (inclusive)

---

#### `GET /tenders/:id`
Get a single tender by ID.

**Response (200):** `TenderResponseDto` (includes `assignedEstimator` and `createdBy` relations)

---

#### `GET /tenders/check-source-email`
Check if a `sourceEmailId` is already taken.

| Query          | Type   | Description                    |
|----------------|--------|--------------------------------|
| `sourceEmailId` | string | The Gmail message ID to check  |

**Response (200):**
```json
{ "exists": true }
```

**Response (409):** never — a 409 means the ID is taken, which is just `{ exists: true }`. This endpoint only returns 200.

---

#### `PATCH /tenders/:id`
Update tender fields.

```json
{
  "client": "New Corp",
  "job": "Updated job",
  "received": "2026-07-25T00:00:00.000Z",
  "due": "2026-09-01T00:00:00.000Z",
  "email": "new@corp.com"
}
```

All fields optional.

**Response (200):** `TenderResponseDto`

---

#### `PATCH /tenders/:id/status`
Update status. If status changed to `Won`, `isSigned` is automatically set to `true`. Creates an audit log entry on change.

```json
{
  "status": "Won"
}
```

**Response (200):** `TenderResponseDto`

---

#### `PATCH /tenders/:id/estimate`
Update the contract sum estimate. Creates an audit log entry with old/new values.

```json
{
  "contractSum": 75000
}
```

**Response (200):** `TenderResponseDto`

---

#### `DELETE /tenders/:id`
Soft-delete a tender (sets `isDeleted: true`, `deletedAt: now`).

- **409 Conflict** if tender is signed (`isSigned: true`) or already deleted
- **404** if not found

**Response (200):**
```json
{ "deleted": true }
```

---

#### `POST /tenders/:id/restore`
Restore a soft-deleted tender.

- **409 Conflict** if tender is not currently deleted

**Response (200):**
```json
{ "deleted": false }
```

---

#### `DELETE /tenders/:id/permanent`
Permanently delete a tender and its audit logs. Requires the user to have the `Tenders` permission (already gated by the controller-level guard).

- **409 Conflict** if tender has not been soft-deleted first

**Response (200):** (empty body)

---

### Integrations (n8n Webhooks)

All require `X-N8N-Secret` header matching `N8N_WEBHOOK_SECRET`.

#### `POST /integrations/tenders/intake`
Gmail intake — parses email body via Claude AI and creates a tender.

```json
{
  "sourceEmailId": "abc123",
  "subject": "RFP — Acme Building",
  "body": "We are inviting bids for...",
  "receivedDate": "2026-07-25"
}
```

- Deduplicates by `sourceEmailId` (unique constraint)
- If Claude confidence is `< 0.7` (low), sets `needsReview: true`

**Response (201):** `{ duplicate: bool, id: string, needsReview: bool }`

---

#### `GET /integrations/tenders/pending-estimates`
Tenders without a `contractSum` where `estimateRequestedAt` is > 2 days old and `lastReminderSentAt` is null.

**Response (200):** `Tender[]`

---

#### `PATCH /integrations/tenders/:id/mark-reminded`
Sets `lastReminderSentAt` to now.

**Response (200):** (empty body)

---

## Response Shape

### `TenderResponseDto`

```json
{
  "id": "uuid",
  "client": "string",
  "job": "string",
  "email": "string",
  "sourceEmailId": "abc123",
  "received": "ISO date string",
  "due": "ISO date string",
  "status": "Pricing | Tendering | Issued | Won | Lost | Withdrawn",
  "contractSum": 50000,
  "isSigned": false,
  "deleted": false,
  "deletedAt": "ISO date string | null",
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}
```

- `email` is mapped from DB — empty string if `null`
- `sourceEmailId` is the Gmail message ID — omitted (`undefined`) when not set
- `contractSum` is `undefined` (omitted) when the requesting user lacks the `Tenders` permission
- `deleted` is the mapping for `isDeleted`

### Error Shape

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

For 403:
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## Models (Prisma)

### Profile
| Field       | Type             |
|-------------|------------------|
| id          | String (PK)      |
| email       | String (unique)  |
| fullName    | String?          |
| role        | admin/estimator/pm |
| permissions | Json             |

### Tender
| Field               | Type                        |
|---------------------|-----------------------------|
| id                  | String (PK, uuid)           |
| client              | String                      |
| job                 | String                      |
| email               | String?                     |
| received            | DateTime                    |
| due                 | DateTime                    |
| status              | Pricing/Tendering/Issued/Won/Lost/Withdrawn |
| contractSum         | Decimal? (12,2)             |
| isSigned            | Boolean                     |
| isDeleted           | Boolean                     |
| deletedAt           | DateTime?                   |
| sourceEmailId       | String? (unique)            |
| needsReview         | Boolean                     |

### AuditLog
| Field       | Type             |
|-------------|------------------|
| id          | String (PK)      |
| entityType  | String           |
| entityId    | String           |
| field       | String           |
| oldValue    | String?          |
| newValue    | String?          |
| changedById | String           |
| changedAt   | DateTime         |

---

## Suppliers CRUD

All require `Authorization: Bearer <jwt>` + `Suppliers` permission. Admin-only actions noted with `@Roles('admin')`.

#### `POST /suppliers`

Create a new supplier.

```json
{
  "company": "Apex Roofing Contractors",
  "trade": "Roofing",
  "contact": "Tom Wright",
  "phone": "07700 900321",
  "email": "tom@apexroofing.co.uk",
  "note": "New supplier",
  "projectIds": [],
  "usedBefore": false
}
```

**Validation:**

| Field | Rules |
|---|---|
| `company` | Required. `@IsString()`, `@MinLength(1)`, `@MaxLength(160)`. Trimmed. |
| `trade` | Required. `@IsEnum(Trade)`. |
| `contact` | Required. `@IsString()`, `@MinLength(1)`, `@MaxLength(120)`. Trimmed. |
| `phone` | Optional. `@IsString()`, `@MaxLength(60)`. |
| `email` | Optional. `@IsEmail()`, `@MaxLength(160)`. |
| `note` | Optional. `@IsString()`, `@MaxLength(600)`. |
| `projectIds` | Optional. `@IsArray()`, `@IsString({ each: true })`. |
| `usedBefore` | Optional. `@IsBoolean()`. Default `false`. |

**Response (201):** `SupplierDetailDto`

---

#### `GET /suppliers`

List suppliers with filtering, search, and pagination.

| Query | Type | Default | Description |
|---|---|---|---|
| `trade` | `Trade?` | — | Filter by trade |
| `search` | `string?` | — | Search company, contact, email, note (ILIKE) |
| `includeDeleted` | `boolean` | `false` | Include soft-deleted |
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `20` | Items per page (max 100) |
| `sortBy` | `'company' \| 'trade' \| 'createdAt'` | `'company'` | Sort field |
| `sortOrder` | `'asc' \| 'desc'` | `'asc'` | Sort direction |

**Response (200):**
```json
{
  "data": [
    {
      "id": "clx...",
      "company": "Hartley Groundworks",
      "trade": "Groundworks",
      "contact": "Dave Hartley",
      "phone": "07700 900123",
      "email": "dave@hartleygroundworks.co.uk",
      "note": "Used on 12 Burtenshaw, reliable",
      "projectIds": ["12-burtenshaw"],
      "usedBefore": true,
      "isDeleted": false,
      "createdAt": "2026-07-20T10:00:00Z",
      "updatedAt": "2026-07-20T10:00:00Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

#### `GET /suppliers/:id`

Get a single supplier with documents and Dropbox links.

**Response (200):**
```json
{
  "id": "clx...",
  "company": "Hartley Groundworks",
  "trade": "Groundworks",
  "contact": "Dave Hartley",
  "phone": "07700 900123",
  "email": "dave@hartleygroundworks.co.uk",
  "note": "Used on 12 Burtenshaw, reliable",
  "projectIds": ["12-burtenshaw"],
  "usedBefore": true,
  "isDeleted": false,
  "ramsUrl": "https://dropbox.com/s/xyz...",
  "ramsExpiry": "2027-01-15",
  "insuranceUrl": null,
  "insuranceExpiry": null,
  "cisStatus": "Registered",
  "cisExpiry": "2027-06-01",
  "dropboxAccountId": "dbid:...",
  "dropboxFolderPath": "/Suppliers/Hartley Groundworks/",
  "documents": [
    {
      "id": "doc_01",
      "fileName": "RAMS_2026.pdf",
      "fileSize": 2048576,
      "mimeType": "application/pdf",
      "dropboxPath": "/Suppliers/Hartley Groundworks/RAMS_2026.pdf",
      "dropboxLink": "https://dropbox.com/s/xyz...",
      "category": "RAMS",
      "uploadedAt": "2026-07-20T10:00:00Z"
    }
  ],
  "dropboxLinks": [
    {
      "id": "dbl_01",
      "dropboxPath": "/Suppliers/Hartley Groundworks/RAMS_2026.pdf",
      "dropboxUrl": "https://dropbox.com/s/xyz...",
      "fileName": "RAMS_2026.pdf",
      "fileSize": 2048576,
      "description": "RAMS document for 12 Burtenshaw",
      "createdAt": "2026-07-20T10:00:00Z"
    }
  ],
  "createdAt": "2026-07-20T10:00:00Z",
  "updatedAt": "2026-07-20T10:00:00Z"
}
```

---

#### `PATCH /suppliers/:id`

Update an existing supplier. All fields optional (PATCH semantics).

- **404** if not found or `isDeleted = true`.

---

#### `DELETE /suppliers/:id` (Admin only)

Soft-delete (sets `isDeleted = true`, `deletedAt = now()`).

- **409** if already deleted.
- **409** if linked to active projects — body: `{ message: "Cannot archive — supplier has active project links", projectCount: 3 }`.

**Response:** `200 OK` with updated supplier.

---

#### `DELETE /suppliers/:id/permanent` (Admin only)

Permanently delete a supplier and all its audit logs. Only works on already soft-deleted suppliers.

- **404** if not found.
- **409** if the supplier hasn't been soft-deleted first (safety measure).
- Related `SupplierDocument` and `DropboxLink` records are cascade-deleted automatically.

**Response:** `204 No Content`.

---

#### `POST /suppliers/:id/restore` (Admin only)

Restore a soft-deleted supplier.

- **404** if not found.
- **409** if not currently deleted.

**Response:** `200 OK` with restored supplier.

---

#### `POST /suppliers/merge` (Admin only)

Merge duplicate suppliers.

```json
{
  "primaryId": "clx_primary",
  "duplicateIds": ["clx_dup1", "clx_dup2"]
}
```

**Logic:**
1. Validate all exist and are not deleted.
2. Union `projectIds` from duplicates into primary.
3. Transfer all `SupplierDocument` and `DropboxLink` records to primary.
4. Set `usedBefore = true` if any duplicate has it.
5. Soft-delete duplicates.
6. Audit log: `action: "MERGE_SUPPLIERS"`.

**Response:** `200 OK` with merged `SupplierDetailDto`.

---

### Dropbox Upload

#### `POST /suppliers/:id/dropbox/upload`

Upload a file to supplier's Dropbox folder and store the shareable link.

**Request:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | File | Max 50MB. Allowed: `.pdf`, `.doc`, `.docx`, `.jpg`, `.png`, `.heic`, `.xlsx`, `.csv` |
| `category` | string | `"RAMS"` \| `"INSURANCE"` \| `"CIS"` \| `"METHOD_STATEMENT"` \| `"OTHER"` |
| `description` | string? | Optional user description |

**Response (201):** `DropboxLinkDto`

---

#### `POST /suppliers/:id/dropbox/link`

Manually store a Dropbox share link (user pastes URL).

```json
{
  "dropboxUrl": "https://www.dropbox.com/s/abc123/...",
  "fileName": "Insurance_2026.pdf",
  "fileSize": 1048576,
  "mimeType": "application/pdf",
  "category": "INSURANCE",
  "description": "Insurance certificate from Zurich"
}
```

**Validation:** `dropboxUrl` must match `https://www.dropbox.com/**` pattern.

**Response:** `201 Created`.

---

#### `GET /suppliers/:id/dropbox/links`

List all Dropbox links for a supplier.

**Response (200):**
```json
{
  "data": [
    {
      "id": "dbl_01",
      "dropboxPath": "/Suppliers/Apex Roofing/RAMS_2026-07-26.pdf",
      "dropboxUrl": "https://www.dropbox.com/s/xyz...",
      "fileName": "RAMS_2026-07-26.pdf",
      "fileSize": 2048576,
      "mimeType": "application/pdf",
      "category": "RAMS",
      "description": "RAMS for 12 Burtenshaw",
      "uploadedBy": "user_01",
      "createdAt": "2026-07-26T10:00:00Z"
    }
  ]
}
```

#### `DELETE /suppliers/:id/dropbox/links/:linkId` (Admin only)

Remove a link record (does NOT delete the file from Dropbox).

**Response:** `204 No Content`.

---

### Compliance

#### `GET /suppliers/compliance/expiring`

Get suppliers with expiring compliance documents.

| Query | Type | Default | Description |
|---|---|---|---|
| `withinDays` | `number` | `30` | Expiry window |
| `categories` | `string` | `"RAMS,INSURANCE,CIS"` | Comma-separated categories to check |

**Response (200):**
```json
{
  "data": [
    {
      "supplierId": "clx...",
      "supplierName": "Hartley Groundworks",
      "trade": "Groundworks",
      "expiringItems": [
        {
          "category": "RAMS",
          "expiryDate": "2026-08-15",
          "daysRemaining": 20,
          "documentUrl": "https://dropbox.com/s/xyz...",
          "status": "expiring_soon"
        }
      ]
    }
  ]
}
```

**Status mapping:**

| Condition | Status | Colour |
|---|---|---|
| Expiry < 30 days | `expiring_soon` | Amber |
| Expiry < now | `expired` | Red |
| No document uploaded | `missing` | Grey |

---

### Dropbox Integration

#### `GET /integrations/dropbox/auth`

Initiate Dropbox OAuth flow.

| Query | Type | Description |
|---|---|---|
| `redirectUri` | `string` | Frontend callback URL |

**Response:** Redirect URL string.

#### `GET /integrations/dropbox/callback`

Dropbox OAuth callback. Handles code exchange and token storage.

| Query | Type | Description |
|---|---|---|
| `code` | `string` | Auth code from Dropbox |
| `state` | `string` | State token for CSRF |
| `redirectUri` | `string` | Same redirect URI used in auth step |

#### `DELETE /integrations/dropbox` (Admin only)

Disconnect Dropbox (sets `disconnectedAt`).

**Response:** `204 No Content`.

#### `GET /integrations/dropbox/status`

Check connection status.

**Response (200):**
```json
{
  "connected": true,
  "accountEmail": "rob@icaroprojects.com",
  "connectedAt": "2026-07-20T10:00:00Z"
}
```

---

### Dashboard Layout

Persists each user's widget layout (x, y grid position, colSpan, rowSpan). Base path: `/dashboard/layout`.

All endpoints require `Authorization: Bearer <jwt>`. All authenticated users can read/write their own layout (no module permission gate). The reset endpoint is **admin-only**.

*Note on spec deltas vs `docs/dashboard-layout.md`:*
- The spec's `PUT /api/dashboard/layout` is implemented as **`PATCH /dashboard/layout`** to comply with the server's CORS allow-list (`GET, POST, PATCH, DELETE`) and codebase convention (`/tenders`, `/suppliers`).
- `tenantId` is sourced from the `TENANT_ID` env var (default `'default'`); the Supabase JWT payload does not include `tenantId`.
- Audit entries are written inline (no `AuditLogModule`) following the tenders/suppliers convention.

---

#### `GET /dashboard/layout`

Returns the current user's widget layout and the full widget catalog. If no saved row exists, returns the server-defined `DEFAULT_LAYOUT`. Unknown widget IDs in a saved row are stripped silently and logged; if every entry is unknown the defaults are returned instead. A saved empty layout (`widgets: []`) is returned as-is — the dashboard's empty state.

**Response `200 OK`:**
```json
{
  "widgets": [
    { "id": "cash-at-risk", "x": 0, "y": 0, "colSpan": 4, "rowSpan": 2 },
    { "id": "ceo-actions",  "x": 4, "y": 0, "colSpan": 4, "rowSpan": 2 }
  ],
  "catalog": [
    {
      "id": "cash-at-risk",
      "group": "Financials",
      "name": "Cash at risk",
      "desc": "Total overdue client cash by project.",
      "available": true,
      "active": true
    },
    {
      "id": "dropbox-revisions",
      "group": "Integrations",
      "name": "Dropbox — recent revisions",
      "desc": "New drawings synced from Dropbox.",
      "requires": "Dropbox",
      "available": false,
      "active": false
    }
  ]
}
```

| Catalog field | Type | Description |
|---|---|---|
| `id` | `string` | Widget identifier (matches `WIDGET_CATALOG_IDS`) |
| `group` | `string` | Grouping category: `Financials`, `Actions`, `Tenders`, `Projects`, or `Integrations` |
| `name` | `string` | Display name for the widget |
| `desc` | `string` | Short description of what the widget shows |
| `requires` | `string?` | Integration required (e.g. `"Dropbox"`). Absent if no integration needed |
| `available` | `boolean` | Whether the required integration is connected (`true` if no `requires` or integration is connected) |
| `active` | `boolean` | Whether the widget is toggled active in the user's catalog config (persisted in `DashboardCatalogConfig`) |

---

#### `PATCH /dashboard/layout`

Upsert the current user's layout. Rate-limited to **30 requests per minute** per user (via `@ThrottlerGuard` on the controller and `@Throttle` on this route).

**Request body:**
```json
{
  "widgets": [
    { "id": "cash-at-risk", "x": 0, "y": 0, "colSpan": 6, "rowSpan": 2 },
    { "id": "ceo-actions",  "x": 6, "y": 0, "colSpan": 6, "rowSpan": 1 }
  ]
}
```

**Validation (`class-validator`):**

| Field | Rules |
|---|---|
| `widgets` | Required. `@IsArray()`, `@ArrayMaxSize(20)`, `@ValidateNested({ each: true })`. |
| `widgets[].id` | Required. `@IsString()`, `@IsIn(WIDGET_CATALOG_IDS)` (see list below). |
| `widgets[].x` | Required. `@IsInt()`, `@Min(0)`. Grid column position. |
| `widgets[].y` | Required. `@IsInt()`, `@Min(0)`. Grid row position. |
| `widgets[].colSpan` | Required. `@IsInt()`, `@Min(2)`, `@Max(12)`. |
| `widgets[].rowSpan` | Required. `@IsInt()`, `@Min(1)`, `@Max(6)`. |
| Duplicate IDs | Rejected by a custom `@ValidatorConstraint` (`NoDuplicateWidgetIds`). The 400 body is `{ message: "Duplicate widget IDs are not allowed", duplicates: ["cash-at-risk"] }`. |

Known widget IDs (from `src/modules/dashboard/constants/widget-catalog.ts`):

```
cash-at-risk, cash-position, client-invoices, sub-invoices,
ceo-actions, waiting-client, brain-dump,
tender-snapshot, live-projects,
docusign, dropbox-revisions, gmail-tenders,
supplier-trades
```

**Response `200 OK`:** the saved layout with widget catalog (same shape as `GET`).

On save, an audit log entry is written:
```
entityType: "DashboardLayout", field: "widgets",
newValue: { widgetCount: <n> },   // never the full widget array
changedById: <user.id>
```

---

#### `POST /dashboard/layout/reset`  (admin only — `@Roles('admin')`)

Deletes the current user's saved layout row. Subsequent `GET` calls return the server defaults. If no row exists the call is a no-op on the DB (and no audit entry is written) but the response still reports `reset: true`.

**Response `200 OK`:**
```json
{
  "widgets": [
    { "id": "cash-at-risk", "x": 0, "y": 0, "colSpan": 4, "rowSpan": 2 }
  ],
  "catalog": [
    { "id": "cash-at-risk", "group": "Financials", "name": "Cash at risk", "desc": "...", "available": true, "active": true }
  ],
  "reset": true,
  "message": "Layout reset to defaults"
}
```

When a row is deleted, an audit log is written with `field: "reset"`, `oldValue: { widgetCount: <previous.length> }`, `newValue: null`.

---

**RBAC matrix (dashboard):**

| Endpoint | Admin | Estimator | PM |
|---|---|---|---|
| `GET /dashboard/layout` | ✅ | ✅ | ✅ |
| `PATCH /dashboard/layout` | ✅ | ✅ | ✅ |
| `POST /dashboard/layout/reset` | ✅ | ❌ | ❌ |

**Error shapes:**

| Status | Trigger | Body |
|---|---|---|
| 400 | Unknown widget ID(s) in request | class-validator default array (whitelist + forbidNonWhitelisted enforced by global `ValidationPipe`) |
| 400 | Duplicate widget IDs | `{ message: "Duplicate widget IDs are not allowed", duplicates: [...] }` |
| 403 | Non-admin calls `/reset` | `{ statusCode: 403, message: "Insufficient role. Admin access required.", error: "Forbidden" }` |
| 429 | >30 PATCH calls/min | throttler default 429 body |

---

### Dashboard Catalog

Persists which widgets are toggled active in the catalog per user. Active state is independent of layout placement — a widget can be active in the catalog without being placed on the dashboard. Base path: `/dashboard/catalog`.

All endpoints require `Authorization: Bearer <jwt>`. All authenticated users can read/update their own catalog config. The reset endpoint is available to all roles (unlike layout reset which is admin-only).

---

#### `GET /dashboard/catalog`

Returns the full widget catalog with `available` (integration check) and `active` (from user's persisted config). When no config row exists, all available widgets default to `active: true`.

**Response `200 OK`:**
```json
{
  "catalog": [
    {
      "id": "cash-at-risk",
      "group": "Financials",
      "name": "Cash at risk",
      "desc": "Total overdue client cash by project.",
      "available": true,
      "active": true
    },
    {
      "id": "dropbox-revisions",
      "group": "Integrations",
      "name": "Dropbox — recent revisions",
      "desc": "New drawings synced from Dropbox.",
      "requires": "Dropbox",
      "available": false,
      "active": false
    }
  ]
}
```

Catalog entry fields are identical to those documented in `GET /dashboard/layout`.

---

#### `PATCH /dashboard/catalog`

Upsert the user's active widget ID list. Rate-limited to **30 requests per minute** per user.

**Request body:**
```json
{
  "activeWidgetIds": ["cash-at-risk", "ceo-actions", "brain-dump"]
}
```

**Validation (`class-validator`):**

| Field | Rules |
|---|---|
| `activeWidgetIds` | Required. `@IsArray()`, `@ArrayMaxSize(20)`, `@IsString({ each: true })`, `@IsIn(WIDGET_CATALOG_IDS, { each: true })`. |
| Duplicate IDs | Rejected by a custom `@ValidatorConstraint` (`NoDuplicateStrings`). The 400 body is `{ message: "Duplicate values are not allowed", duplicates: ["cash-at-risk"] }`. |

Known widget IDs (from `src/modules/dashboard/constants/widget-catalog.ts`):
```
cash-at-risk, cash-position, client-invoices, sub-invoices,
ceo-actions, waiting-client, brain-dump,
tender-snapshot, live-projects,
docusign, dropbox-revisions, gmail-tenders,
supplier-trades
```

**Response `200 OK`:** the catalog with updated active state (same shape as `GET`).

---

#### `POST /dashboard/catalog/reset`

Deletes the user's `DashboardCatalogConfig` row. Subsequent `GET` calls return all available widgets as `active: true`. Available to all authenticated roles.

**Response `200 OK`:**
```json
{
  "catalog": [
    { "id": "cash-at-risk", "group": "Financials", "name": "Cash at risk", "desc": "...", "available": true, "active": true }
  ]
}
```

---

**RBAC matrix (dashboard catalog):**

| Endpoint | Admin | Estimator | PM |
|---|---|---|---|
| `GET /dashboard/catalog` | ✅ | ✅ | ✅ |
| `PATCH /dashboard/catalog` | ✅ | ✅ | ✅ |
| `POST /dashboard/catalog/reset` | ✅ | ✅ | ✅ |

### DashboardLayout (Prisma)
| Field | Type |
|---|---|
| id | String (PK, cuid) |
| tenantId | String |
| userId | String |
| widgets | Json (`WidgetInstance[]`) |
| createdAt | DateTime (`@default(now())`) |
| updatedAt | DateTime (`@updatedAt`) |

Unique: `[tenantId, userId]` · Index: `[tenantId]` · Table: `dashboard_layouts`.

### DashboardCatalogConfig (Prisma)
| Field | Type |
|---|---|
| id | String (PK, cuid) |
| tenantId | String |
| userId | String |
| activeWidgetIds | Json (`string[]`) |
| createdAt | DateTime (`@default(now())`) |
| updatedAt | DateTime (`@updatedAt`) |

Unique: `[tenantId, userId]` · Index: `[tenantId]` · Table: `dashboard_catalog_configs`.

---

## Additional Models (Prisma)

### Supplier
| Field | Type |
|---|---|
| id | String (PK, cuid) |
| tenantId | String |
| company | String |
| trade | Trade (enum) |
| contact | String |
| phone | String |
| email | String |
| note | String |
| projectIds | String[] |
| usedBefore | Boolean |
| isDeleted | Boolean |
| deletedAt | DateTime? |
| ramsUrl | String? |
| ramsExpiry | DateTime? |
| insuranceUrl | String? |
| insuranceExpiry | DateTime? |
| cisStatus | CisStatus (enum) |
| cisExpiry | DateTime? |
| dropboxAccountId | String? |
| dropboxFolderPath | String? |
| documents | SupplierDocument[] (relation) |
| dropboxLinks | DropboxLink[] (relation) |

### SupplierDocument
| Field | Type |
|---|---|
| id | String (PK, cuid) |
| supplierId | String (FK) |
| fileName | String |
| fileSize | Int |
| mimeType | String |
| dropboxPath | String |
| dropboxLink | String |
| dropboxRev | String? |
| category | String |
| uploadedBy | String |
| uploadedAt | DateTime |

### DropboxLink
| Field | Type |
|---|---|
| id | String (PK, cuid) |
| supplierId | String (FK) |
| dropboxPath | String |
| dropboxUrl | String |
| fileName | String |
| fileSize | Int? |
| mimeType | String? |
| description | String? |
| uploadedBy | String |
| createdAt | DateTime |

### DropboxToken
| Field | Type |
|---|---|
| id | String (PK, cuid) |
| tenantId | String |
| userId | String |
| accountId | String |
| accountEmail | String? |
| accessToken | String |
| refreshToken | String? |
| tokenExpiry | DateTime? |
| connectedAt | DateTime |
| disconnectedAt | DateTime? |

---

## New Enums

### Trade
`Groundworks`, `Electrical`, `Plumbing`, `Roofing`, `Joinery`, `Plastering`, `Other`

### CisStatus
`Registered`, `Verified`, `Gross`, `Unregistered`

---

## RBAC Matrix (Suppliers)

| Endpoint | Admin | Estimator | PM |
|---|---|---|---|
| `POST /suppliers` | ✅ | ✅ | ✅ |
| `GET /suppliers` | ✅ | ✅ | ✅ |
| `GET /suppliers/:id` | ✅ | ✅ | ✅ |
| `PUT /suppliers/:id` | ✅ | ✅ | ✅ |
| `DELETE /suppliers/:id` | ✅ | ❌ | ❌ |
| `DELETE /suppliers/:id/permanent` | ✅ | ❌ | ❌ |
| `POST .../restore` | ✅ | ❌ | ❌ |
| `POST .../merge` | ✅ | ❌ | ❌ |
| `POST .../dropbox/upload` | ✅ | ✅ | ✅ |
| `POST .../dropbox/link` | ✅ | ✅ | ✅ |
| `GET .../dropbox/links` | ✅ | ✅ | ✅ |
| `DELETE .../dropbox/links/:id` | ✅ | ❌ | ❌ |
| `GET /integrations/dropbox/*` | ✅ | ✅ | ✅ |
| `DELETE /integrations/dropbox` | ✅ | ❌ | ❌ |
