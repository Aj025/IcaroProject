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

| Method | Path        | Auth  | Description         |
|--------|-------------|-------|---------------------|
| GET    | `/health`   | No    | Server health check |

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
  "email": "client@acme.com"
}
```

- `status`: optional, defaults to `Pricing`. Enums: `Pricing`, `Tendering`, `Issued`, `Won`, `Lost`, `Withdrawn`
- `contractSum`: optional, >= 0
- `email`: optional string — client contact email
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

#### `PATCH /tenders/:id`
Update client, job, or due date.

```json
{
  "client": "New Corp",
  "job": "Updated job",
  "due": "2026-09-01T00:00:00.000Z",
  "email": "new@corp.com"
}
```

All fields optional (`email` included).

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
