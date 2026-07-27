# Suppliers Module — Backend Specification

> Target: NestJS + PostgreSQL 16 + Prisma ORM  
> Frontend repo: `src/features/suppliers/`  
> See also: `PROJECT.md` §4 (module structure), §5 (roadmap), §6 (RBAC rules)

---

## 1. Database Schema (Prisma)

```prisma
enum Trade {
  Groundworks
  Electrical
  Plumbing
  Roofing
  Joinery
  Plastering
  Other
}

enum CisStatus {
  Registered
  Verified
  Gross
  Unregistered
}

model Supplier {
  id              String    @id @default(cuid())
  tenantId        String

  company         String
  trade           Trade
  contact         String
  phone           String    @default("")
  email           String    @default("")
  note            String    @default("")
  projectIds      String[]
  usedBefore      Boolean   @default(false)

  isDeleted       Boolean   @default(false) @map("is_deleted")
  deletedAt       DateTime?

  ramsUrl         String?
  ramsExpiry      DateTime?
  insuranceUrl    String?
  insuranceExpiry DateTime?
  cisStatus       CisStatus @default(Unregistered)
  cisExpiry       DateTime?

  dropboxAccountId  String?
  dropboxFolderPath String?
  dropboxLinks      DropboxLink[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  documents       SupplierDocument[]

  @@index([tenantId, isDeleted])
  @@index([trade])
  @@index([company])
  @@map("suppliers")
}

model SupplierDocument {
  id              String   @id @default(cuid())
  supplierId      String
  supplier        Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)

  fileName        String
  fileSize        Int
  mimeType        String
  dropboxPath     String
  dropboxLink     String
  dropboxRev      String?
  category        String   // "RAMS" | "INSURANCE" | "CIS" | "METHOD_STATEMENT" | "OTHER"

  uploadedBy      String
  uploadedAt      DateTime @default(now())

  @@index([supplierId])
  @@map("supplier_documents")
}

model DropboxLink {
  id              String   @id @default(cuid())
  supplierId      String
  supplier        Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)

  dropboxPath     String
  dropboxUrl      String
  fileName        String
  fileSize        Int?
  mimeType        String?
  description     String?
  uploadedBy      String
  createdAt       DateTime @default(now())

  @@index([supplierId])
  @@map("dropbox_links")
}

model DropboxToken {
  id              String   @id @default(cuid())
  tenantId        String
  userId          String
  accountId       String
  accountEmail    String?
  accessToken     String
  refreshToken    String?
  tokenExpiry     DateTime?
  connectedAt     DateTime @default(now())
  disconnectedAt  DateTime?

  @@index([tenantId, userId])
  @@map("dropbox_tokens")
}
```

### Field mapping: Frontend → Backend

| Frontend (`Supplier` interface) | Backend (`suppliers` table) | Notes |
|---|---|---|
| `id` | `id` | `cuid()` auto-generated |
| `company` | `company` | Required. Max 160 chars. |
| `trade` | `trade` | Enum: `Groundworks`, `Electrical`, `Plumbing`, `Roofing`, `Joinery`, `Plastering`, `Other` |
| `contact` | `contact` | Contact person name. Max 120 chars. |
| `phone` | `phone` | Optional. Max 60 chars. |
| `email` | `email` | Optional. Max 160 chars. |
| `note` | `note` | Optional. Max 600 chars. |
| `projectIds` | `projectIds` | JSON array of project ID strings |
| `usedBefore` | `usedBefore` | Boolean |
| `deleted` | `isDeleted` | Soft delete via Prisma middleware |

### New backend-only fields

| Field | Purpose |
|---|---|
| `ramsUrl`, `ramsExpiry` | RAMS document Dropbox link + expiry date |
| `insuranceUrl`, `insuranceExpiry` | Insurance certificate Dropbox link + expiry date |
| `cisStatus`, `cisExpiry` | CIS registration status + expiry |
| `dropboxAccountId`, `dropboxFolderPath` | Dropbox account and folder path |
| `documents` | Relation to `SupplierDocument` table |

---

## 2. API Endpoints

Base path: `/api/suppliers`  
Auth: `@UseGuards(AuthGuard)` on all.  
RBAC per endpoint (see §4.5).

### 2.1 Core CRUD

#### `GET /api/suppliers`

List suppliers with filtering, search, and pagination.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `trade` | `Trade?` | — | Filter by trade |
| `search` | `string?` | — | Search company, contact, email, note (ILIKE) |
| `includeDeleted` | `boolean` | `false` | Include soft-deleted |
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `20` | Items per page (max 100) |
| `sortBy` | `'company' \| 'trade' \| 'createdAt'` | `'company'` | Sort field |
| `sortOrder` | `'asc' \| 'desc'` | `'asc'` | Sort direction |

**Response:**
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

#### `GET /api/suppliers/:id`

Get a single supplier with documents and Dropbox links.

**Response:**
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

#### `POST /api/suppliers`

Create a new supplier.

**Request body:**
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

**Response:** `201 Created`.

#### `PUT /api/suppliers/:id`

Update an existing supplier. All fields optional (PATCH semantics).

**Edge cases:**
- `404` if not found or `isDeleted = true`.

#### `DELETE /api/suppliers/:id`

Soft-delete (sets `isDeleted = true`, `deletedAt = now()`).

**RBAC:** `@Roles(Role.Admin)`.

**Response:** `204 No Content`.

**Edge cases:**
- `409` if already deleted.
- `409` if linked to active projects — body: `{ message: "Cannot archive — supplier has active project links", projectCount: 3 }`.

#### `POST /api/suppliers/:id/restore`

Restore a soft-deleted supplier.

**Response:** `200 OK`.

#### `POST /api/suppliers/merge`

Merge duplicate suppliers.

**Request body:**
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

**Response:** `200 OK` with merged supplier.

---

### 2.2 Dropbox Upload Endpoints

#### `POST /api/suppliers/:id/dropbox/upload`

Upload a file to supplier's Dropbox folder and store the shareable link.

**Request:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | File | Max 50MB. Allowed: `.pdf`, `.doc`, `.docx`, `.jpg`, `.png`, `.heic`, `.xlsx`, `.csv` |
| `category` | string | `"RAMS"` \| `"INSURANCE"` \| `"CIS"` \| `"METHOD_STATEMENT"` \| `"OTHER"` |
| `description` | string? | Optional user description |

**Flow:**
1. Validate file type and size.
2. Check user has connected Dropbox token. If not → `400` with `{ needsAuth: true, message: "Dropbox not connected" }`.
3. Determine path: `/{dropboxFolderPath}/{category}_{timestamp}_{originalName}`.
4. Upload via Dropbox API `/files/upload`.
5. Create shared link via `/sharing/create_shared_link_with_settings` (visibility: `team_only` or `public` per tenant config).
6. Store in `DropboxLink` table + `SupplierDocument` table.
7. Update compliance field (`ramsUrl`, `insuranceUrl`) if category matches.

**Response:** `201 Created`
```json
{
  "id": "dbl_01",
  "dropboxPath": "/Suppliers/Apex Roofing/RAMS_2026-07-26.pdf",
  "dropboxUrl": "https://www.dropbox.com/s/xyz...",
  "fileName": "RAMS_2026-07-26.pdf",
  "fileSize": 2048576,
  "category": "RAMS",
  "description": "RAMS for 12 Burtenshaw",
  "createdAt": "2026-07-26T10:00:00Z"
}
```

#### `POST /api/suppliers/:id/dropbox/link`

Manually store a Dropbox share link (user pastes URL).

**Request body:**
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

**Validation:**
- `dropboxUrl`: must match `https://www.dropbox.com/**` pattern.

**Response:** `201 Created`.

#### `GET /api/suppliers/:id/dropbox/links`

List all Dropbox links for a supplier.

**Response:**
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

#### `DELETE /api/suppliers/:id/dropbox/links/:linkId`

Remove a link record (does NOT delete the file from Dropbox).

**RBAC:** `@Roles(Role.Admin)`.

**Response:** `204 No Content`.

---

### 2.3 Dropbox OAuth Endpoints

#### `GET /api/integrations/dropbox/auth`

Initiate Dropbox OAuth flow.

**Query params:** `redirectUri` — frontend callback URL.

**Flow:**
1. Generate state token (10min expiry, stored in Redis/DB).
2. Redirect to Dropbox authorize URL.

#### `GET /api/integrations/dropbox/callback`

Dropbox OAuth callback.

**Query params:** `code`, `state`.

**Flow:**
1. Validate state token.
2. Exchange `code` for `access_token` + `refresh_token`.
3. Call `/users/get_current_account` for `account_id` + `email`.
4. Encrypt tokens via `EncryptionService` (AES-256-GCM).
5. Upsert `DropboxToken` by `tenantId + userId`.
6. Redirect to frontend.

#### `DELETE /api/integrations/dropbox`

Disconnect Dropbox.

**RBAC:** `@Roles(Role.Admin)`.

**Response:** `204 No Content`. Sets `disconnectedAt`.

#### `GET /api/integrations/dropbox/status`

Check connection status.

**Response:**
```json
{
  "connected": true,
  "accountEmail": "rob@icaroprojects.com",
  "connectedAt": "2026-07-20T10:00:00Z"
}
```

---

### 2.4 Compliance Endpoints

#### `GET /api/suppliers/compliance/expiring`

Get suppliers with expiring compliance documents.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `withinDays` | `number` | `30` | Expiry window |
| `categories` | `string[]` | `["RAMS", "INSURANCE", "CIS"]` | Categories to check |

**Response:**
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

---

## 3. Drag-and-Drop Upload Flow

```
User drags file onto supplier card/profile
        │
        ▼
Frontend: is Dropbox connected?
   ┌────┴────┐
   │  NO     │ YES
   │         │
   ▼         ▼
Show modal   POST /api/suppliers/:id/dropbox/upload
"Connect     multipart/form-data
 Dropbox     │
 first"      ├── Backend validates file type & size
             ├── Uploads to Dropbox /files/upload
             ├── Creates shared link
             └── Returns DropboxLink record
                    │
                    ▼
              Frontend shows preview/thumbnail
              Updates compliance pill (if applicable)
              Shows "Uploaded to Dropbox ✓" toast
```

### Paste Link Flow

```
User copies Dropbox URL and pastes
        │
        ▼
POST /api/suppliers/:id/dropbox/link
{ dropboxUrl, fileName, category, ... }
        │
        ▼
Backend validates URL format
Stores link record
Returns DropboxLink
```

---

## 4. Business Rules & Edge Cases

### 4.1 Soft Delete
- Never physically deletes rows — sets `isDeleted = true`.
- `GET /api/suppliers` excludes deleted by default.
- Deleted suppliers cannot be edited (`404`).
- Restore sets `isDeleted = false`, `deletedAt = null`.

### 4.2 Merge Duplicates
- Primary absorbs all `projectIds`, `documents`, `dropboxLinks`.
- Duplicates are soft-deleted.
- Audit log entry created.

### 4.3 Dropbox Upload Rules

| Rule | Detail |
|---|---|
| File size | Max 50MB per file |
| Allowed types | `.pdf`, `.doc`, `.docx`, `.jpg`, `.png`, `.heic`, `.xlsx`, `.csv` |
| Rate limit | Max 10 uploads/min per user |
| Folder structure | `/{root}/{company}/{category}_{timestamp}_{filename}` |
| Shared link visibility | Default `team_only`, configurable per tenant |
| Token encryption | AES-256-GCM at rest |

### 4.4 Compliance Warnings

| Condition | Status | Colour |
|---|---|---|
| Expiry < 30 days | `expiring_soon` | Amber |
| Expiry < now | `expired` | Red |
| No document uploaded | `missing` | Grey |

### 4.5 RBAC Matrix

| Endpoint | Admin | Estimator | PM |
|---|---|---|---|
| `GET /api/suppliers` | ✅ | ✅ | ✅ |
| `POST /api/suppliers` | ✅ | ✅ | ✅ |
| `PUT /api/suppliers/:id` | ✅ | ✅ | ✅ |
| `DELETE /api/suppliers/:id` | ✅ | ❌ | ❌ |
| `POST .../restore` | ✅ | ❌ | ❌ |
| `POST .../merge` | ✅ | ❌ | ❌ |
| `POST .../dropbox/upload` | ✅ | ✅ | ✅ |
| `POST .../dropbox/link` | ✅ | ✅ | ✅ |
| `GET .../dropbox/links` | ✅ | ✅ | ✅ |
| `DELETE .../dropbox/links/:id` | ✅ | ❌ | ❌ |
| `GET /api/integrations/dropbox/*` | ✅ | ✅ | ✅ |
| `DELETE /api/integrations/dropbox` | ✅ | ❌ | ❌ |

---

## 5. Module Structure (NestJS)

```
src/modules/suppliers/
├── suppliers.module.ts
├── suppliers.controller.ts
├── suppliers.service.ts
├── dto/
│   ├── create-supplier.dto.ts
│   ├── update-supplier.dto.ts
│   ├── query-suppliers.dto.ts
│   ├── merge-suppliers.dto.ts
│   ├── upload-dropbox.dto.ts
│   └── store-dropbox-link.dto.ts
├── suppliers.repository.ts
├── suppliers-compliance.service.ts
└── suppliers-dropbox.service.ts

src/modules/integrations/dropbox/
├── dropbox.module.ts
├── dropbox.controller.ts
├── dropbox.service.ts
└── entities/
    └── dropbox-token.entity.ts
```

---

## 6. Key Dependencies

| Package | Purpose |
|---|---|
| `@prisma/client` | Database ORM |
| `class-validator` + `class-transformer` | DTO validation |
| `@nestjs/passport` | Authentication |
| `dropbox` (official SDK) | Dropbox API client |
| `multer` / `@nestjs/platform-express` | File upload |
| `@nestjs/swagger` | API docs (optional) |

---

## 7. Audit Log Events

| Event | Trigger | Details |
|---|---|---|
| `SUPPLIER_CREATED` | `POST /api/suppliers` | `after: { full object }` |
| `SUPPLIER_UPDATED` | `PUT /api/suppliers/:id` | `before`, `after` diff |
| `SUPPLIER_ARCHIVED` | `DELETE /api/suppliers/:id` | `before: { supplier }` |
| `SUPPLIER_RESTORED` | `POST .../restore` | `before`, `after` |
| `SUPPLIER_MERGED` | `POST .../merge` | `duplicateIds`, `primaryId` |
| `SUPPLIER_FILE_UPLOADED` | `POST .../dropbox/upload` | `supplierId, fileName, path, category` |
| `SUPPLIER_FILE_LINKED` | `POST .../dropbox/link` | `supplierId, dropboxUrl, category` |
| `SUPPLIER_FILE_LINK_DELETED` | `DELETE .../dropbox/links/:id` | `supplierId, linkId, dropboxUrl` |
