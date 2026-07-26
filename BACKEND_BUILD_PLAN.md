# 🔧 Icaro Projects — Backend Build Plan (Phase 1: Tenders)

> Living document. Check off tasks as they're completed. Companion to `PROJECT.md`, `DESIGN.md`, `ARCHITECTURE.md`, and `BUILD_PLAN.md`. This document covers the **NestJS backend** — the frontend documents describe UX-layer scaffolding only; this is where RBAC, audit logging, and data validation actually get enforced, per `ARCHITECTURE.md` §3 and §5.

**Status:** Not started
**Scope of this pass:** Tenders module only. No Dashboard/Suppliers/Settings/Projects backend work happens until Tenders is complete end-to-end — including its Gmail intake, estimate, and reminder automation, since that automation *is* the Tenders domain, not a separate module.
**Stack:** NestJS 10 (TypeScript strict) · Prisma · PostgreSQL (Supabase-hosted) · Supabase Auth (JWT verification only — see §2) · n8n (self-hosted, for Gmail intake + scheduled reminders) · Claude API (email parsing)

---

## 0. Assumptions carried over from the frontend docs — confirm before/while building

`PROJECT.md` §8's own convention is "Ask, Don't Assume." Applying that here:

- **`TENDER_STATUSES` exact enum values are not visible in the three uploaded docs** (only referenced, not enumerated). The Prisma enum below uses `NEW / TENDERING / PRICING / WON / LOST`, inferred from the status-pill semantics in `DESIGN.md` §3.3 and the "Mark won / Mark lost" row action in `BUILD_PLAN.md`. **Pull the real values from `src/features/tenders/data/tenders.ts` before locking the migration** — don't ship a guessed enum.
- **`contractSum` visibility rule**: `BUILD_PLAN.md` says "conditionally show `contractSum` column based on estimator role," but the permission list in `ARCHITECTURE.md` §3 has no separate "estimate" module — only `Tenders`. This plan gates `contractSum` on the `Tenders` permission itself. If Rob actually wants margin-style hiding (some roles see the tender exists but not its value), that needs a new permission flag — flag to Rob, don't silently invent one.
- **`is_signed`** is treated as "true once status becomes `WON`" for this phase, since DocuSign isn't wired yet (`BUILD_PLAN.md` Phase 2). Once DocuSign integration lands, real envelope-signed status should drive this instead of the status transition being a stand-in for it.
- **Reminder/notification delivery channel** — Postmark (or similar transactional provider) vs. sending through Rob's real Gmail via n8n — still an open decision from the earlier architecture discussion. This plan defaults to a transactional provider; swap is contained to `common/integrations/email.service.ts` either way.

---

## 1. Base Project Setup

- [ ] Scaffold with `nest new icaro-backend --strict` — TypeScript strict mode to match the frontend's `tsconfig.app.json`
- [ ] Install core deps: `@nestjs/config`, `@nestjs/throttler`, `@nestjs/passport`, `passport-jwt`, `class-validator`, `class-transformer`, `prisma` + `@prisma/client`, `helmet`, `compression`, `@nestjs/terminus`
- [ ] `npx prisma init` — point `DATABASE_URL` at the Supabase Postgres connection string (same database the frontend's Supabase project already uses)
- [ ] Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` registered in `main.ts` — rejects any request body field not declared in a DTO
- [ ] Global exception filter — consistent error shape `{ statusCode, message, error }` across every endpoint, no raw stack traces leak to the client
- [ ] `helmet()` + CORS restricted to an explicit allow-list (`CORS_ORIGIN` env var, comma-separated) — never `origin: '*'`
- [ ] `ThrottlerModule` globally, sane default (e.g. 100 req/min/IP); tighter override on the n8n webhook routes (§2.1)
- [ ] `GET /health` via `@nestjs/terminus` — checks DB connectivity, used by the hosting platform's health checks
- [ ] Structured JSON logging in production (nestjs-pino or built-in `Logger` with a JSON formatter) — plain text logging is fine for local dev only
- [ ] Swagger/OpenAPI at `/docs`, disabled or admin-gated in production
- [ ] `.env.example` committed with every key from §1.1 (no real values); real `.env` stays gitignored
- [ ] `.github/workflows/backend.yml` — typecheck, lint, `prisma validate`, `test`, `build` on push/PR to `main`, mirroring the frontend's planned CI in `BUILD_PLAN.md`

### 1.1 Required environment variables

```
DATABASE_URL=                # Supabase Postgres connection string
SUPABASE_URL=                # for future admin-API calls (invite/remove team members, Phase 2)
SUPABASE_JWT_SECRET=         # verifies tokens issued by Supabase Auth
SUPABASE_SERVICE_ROLE_KEY=   # server-side only — never exposed to any VITE_ frontend var
N8N_WEBHOOK_SECRET=          # shared secret for the intake/reminder service endpoints
CLAUDE_API_KEY=
TRANSACTIONAL_EMAIL_API_KEY= # Postmark/Resend/etc.
CORS_ORIGIN=                 # comma-separated allow-list
PORT=3000
NODE_ENV=
```

---

## 2. Auth & Security Architecture

### 2.1 Identity vs. authorization — the key design decision

The Supabase JWT answers **who is making this request**. It must never be trusted to answer **what they're allowed to do**. `ARCHITECTURE.md` §3 already draws this line for the frontend ("RBAC stays UX-only... backend remains the enforcement boundary") — this section extends the same principle one layer further: the backend shouldn't trust Supabase's `user_metadata` for authorization either, because that field is **user-editable** via the standard Supabase client (`supabase.auth.updateUser()`). A user could, in principle, rewrite their own `user_metadata.role` from the browser console.

So: JWT verification confirms identity only. Role and permissions are looked up fresh from a backend-owned `profiles` table on every request — never cached in the token, never read from `user_metadata`.

- [ ] `SupabaseJwtStrategy` (passport-jwt) — verifies signature with `SUPABASE_JWT_SECRET`, extracts `sub` (user id) and `email`, rejects expired/malformed tokens
- [ ] `AuthGuard` — applies the strategy, attaches `req.user = { id, email }`
- [ ] On every authenticated request, load the matching `Profile` row and attach `role` + `permissions` fresh — a permission revoked in Settings → Team & Permissions takes effect on the person's very next request, not after their token happens to refresh
- [ ] `@RequirePermission('Tenders')` decorator + `PermissionsGuard` — 403s if `req.user.permissions.Tenders !== true`
- [ ] `@CurrentUser()` param decorator for pulling `req.user` into handlers
- [ ] `N8nSecretGuard` — validates an `X-N8N-Secret` header against `N8N_WEBHOOK_SECRET`; used only on the three automation endpoints in §5, completely separate from the user JWT path (n8n isn't a "user")

### 2.2 Supabase-specific hardening (easy to miss, worth calling out explicitly)

- [ ] Confirm Row Level Security is **enabled** on `tenders`, `profiles`, and `audit_log` in the Supabase dashboard — Supabase auto-exposes tables via PostgREST, so an RLS-less table is reachable directly from a browser with just the project's anon key, completely bypassing the NestJS API and every guard above
- [ ] Either turn off PostgREST exposure for these backend-owned tables, or add deny-all RLS policies (`USING (false)`) so NestJS is the *only* path in
- [ ] Double-check `SUPABASE_SERVICE_ROLE_KEY` never ends up in a `VITE_`-prefixed variable or anywhere client-bundled — it already shouldn't per `ARCHITECTURE.md`'s env list, this is just a verify-not-assume step

### 2.3 General API security

- [ ] `class-validator` DTOs on every endpoint — per `ARCHITECTURE.md` §4, this is the actual security boundary; the frontend's `zod` schemas are additive UX only
- [ ] Every write to `contractSum` or `status` inserts an `AuditLog` row (who, field, old value, new value, when) — table is insert-only, no update/delete path exposed anywhere in the app
- [ ] `contractSum` is **omitted from the JSON response entirely** (not nulled) for callers without `Tenders` permission — omission can't be confused with "not estimated yet"
- [ ] n8n webhook endpoints get a stricter throttle tier than user-facing ones — automation traffic is small and predictable, so a tight limit catches misconfiguration or abuse early

---

## 3. Database Schema (Prisma)

```prisma
enum Role {
  admin
  estimator
  pm
}

// ⚠️ Placeholder — confirm exact values against src/features/tenders/data/tenders.ts
enum TenderStatus {
  NEW
  TENDERING
  PRICING
  WON
  LOST
}

model Profile {
  id          String   @id                 // Supabase auth user id — not a separate generated id
  email       String   @unique
  fullName    String?
  role        Role
  permissions Json                          // { Financials, Tenders, Variations, RFIs, Valuations, Risks, "Brain Dump", "Issue to client" } — matches frontend's Permissions type field-for-field
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tendersAssigned Tender[] @relation("AssignedEstimator")
  tendersCreated  Tender[] @relation("CreatedBy")
}

model Tender {
  id                String       @id @default(uuid())

  // Core fields — match NewTenderModal's 5 required fields exactly
  client            String
  jobDescription    String
  receivedDate      DateTime
  dueDate           DateTime
  status            TenderStatus @default(NEW)

  // Optional until an estimator submits it
  contractSum       Decimal?     @db.Decimal(12, 2)

  // Automation fields (new — support the Gmail intake / estimate / reminder flow)
  assignedEstimatorId String?
  assignedEstimator   Profile?   @relation("AssignedEstimator", fields: [assignedEstimatorId], references: [id])
  estimateRequestedAt DateTime?
  estimatedById        String?
  estimatedAt          DateTime?
  lastReminderSentAt   DateTime?
  sourceEmailId        String?   @unique   // Gmail message id — dedupe key so a redelivered webhook can't create a duplicate tender
  needsReview           Boolean  @default(false)  // Claude couldn't confidently extract a field; surfaced for manual review

  isSigned          Boolean      @default(false)  // see §0 — true once status → WON, until DocuSign lands
  isDeleted         Boolean      @default(false)
  deletedAt         DateTime?

  createdById       String?
  createdBy         Profile?     @relation("CreatedBy", fields: [createdById], references: [id])
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  auditLogs AuditLog[]

  @@index([status])
  @@index([dueDate])
  @@index([isDeleted])
}

model AuditLog {
  id          String   @id @default(uuid())
  entityType  String   // "Tender" — kept generic so other modules can reuse this table later
  entityId    String
  field       String   // "contractSum" | "status" | ...
  oldValue    String?
  newValue    String?
  changedById String
  changedAt   DateTime @default(now())

  tender Tender? @relation(fields: [entityId], references: [id])

  @@index([entityType, entityId])
}
```

- [ ] Write the migration, run it against a local/staging Supabase Postgres instance first — never migrate straight against production
- [ ] Seed script inserting a few `Profile` rows (one per role) for local dev, matching the shape `RbacContext` already expects on the frontend

---

## 4. Module Structure

```
src/
├── main.ts
├── app.module.ts
├── config/
│   ├── env.validation.ts        Joi schema — app fails fast on boot if a required var is missing
│   └── configuration.ts
├── common/
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   ├── permissions.guard.ts
│   │   └── n8n-secret.guard.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── require-permission.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── audit-log.interceptor.ts
│   └── integrations/
│       ├── claude.service.ts        Shared Claude API client — reused by future modules (email, WhatsApp)
│       └── email.service.ts         Transactional email wrapper — swap provider in one place
├── prisma/
│   └── prisma.service.ts
└── modules/
    ├── health/
    │   └── health.controller.ts
    ├── auth/
    │   └── supabase-jwt.strategy.ts
    └── tenders/
        ├── tenders.module.ts
        ├── tenders.controller.ts              CRUD, status, soft-delete/restore, snapshot
        ├── tenders.service.ts                 business logic, RBAC field-stripping, audit writes
        ├── tenders-automation.controller.ts   Gmail intake webhook, pending-estimates, mark-reminded
        ├── tenders-automation.service.ts      Claude parsing call, reminder query logic
        └── dto/
            ├── create-tender.dto.ts
            ├── update-tender.dto.ts
            ├── update-tender-status.dto.ts
            ├── update-tender-estimate.dto.ts
            ├── gmail-intake.dto.ts
            └── tender-response.dto.ts         role-aware serialization (drops contractSum when unauthorized)
```

- [ ] Every new module going forward (Dashboard, Suppliers, Settings, Projects) follows this same shape — controller / service / dto, automation split into its own controller+service only where it genuinely exists, per `ARCHITECTURE.md` §1's "features map 1:1 to modules" convention

---

## 5. API Endpoints — Tenders Module

| Method | Path | Auth | Permission | Purpose |
|---|---|---|---|---|
| `POST` | `/tenders` | User JWT | `Tenders` | Create manually — powers `NewTenderModal` |
| `GET` | `/tenders` | User JWT | `Tenders` | List — filters: `status`, `search`, `includeDeleted` |
| `GET` | `/tenders/:id` | User JWT | `Tenders` | Detail view |
| `PATCH` | `/tenders/:id` | User JWT | `Tenders` | Edit core fields (client, job description, due date) |
| `PATCH` | `/tenders/:id/status` | User JWT | `Tenders` | Status dropdown — sets `isSigned = true` if new status is `WON` |
| `PATCH` | `/tenders/:id/estimate` | User JWT | `Tenders` | Submit/edit `contractSum` — always audit-logged, rejects negative values |
| `DELETE` | `/tenders/:id` | User JWT | `Tenders` | Soft delete — `409` if `isSigned = true`, matches the toast copy already specified in `BUILD_PLAN.md` |
| `POST` | `/tenders/:id/restore` | User JWT | `Tenders` | Restore from the Deleted Tenders section |
| `DELETE` | `/tenders/:id/permanent` | User JWT | `Tenders` + `role: admin` | "Delete forever" — only reachable from the Deleted section per `BUILD_PLAN.md` |
| `GET` | `/tenders/snapshot` | User JWT | `Tenders` | Feeds the dashboard Tender Snapshot widget — small, sorted by due date |
| `POST` | `/integrations/tenders/intake` | n8n secret | — (service) | Creates a tender from a Claude-parsed Gmail message |
| `GET` | `/integrations/tenders/pending-estimates` | n8n secret | — (service) | Tenders with no estimate 2+ days after `estimateRequestedAt` |
| `PATCH` | `/integrations/tenders/:id/mark-reminded` | n8n secret | — (service) | Sets `lastReminderSentAt`, stops a same-day duplicate send |

---

## 6. Business Logic Detail

**Soft delete / restore** — `DELETE /tenders/:id` sets `isDeleted = true, deletedAt = now()`, never removes the row. `GET /tenders` excludes `isDeleted` rows unless `includeDeleted=true` is passed (used by the Deleted Tenders section). Blocked entirely (`409`) if `isSigned`.

**Due Soon vs. Overdue** — computed server-side in `tender-response.dto.ts` from `dueDate`, not stored as a column: `overdue` if `dueDate < now`, `dueSoon` if within 2 days. Keeping this computation in one place (rather than duplicating date math on the frontend and again inside the reminder job) means the dashboard badge, the tender register badge, and the reminder automation can never disagree about whether something is overdue.

**`contractSum` RBAC gating** — `tenders.service.ts` strips the field before serialization if `req.user.permissions.Tenders !== true`; the DTO layer is the enforcement point, not a `select` at the Prisma query level, so the same service method can serve both an authorized and unauthorized caller correctly.

**Gmail intake → tender creation** — `tenders-automation.controller.ts` receives the raw email payload from n8n, calls `ClaudeService` to extract `{ client, jobDescription, dueDate }` (`receivedDate` comes straight from the email's own timestamp, not from Claude), creates the `Tender` with `status: NEW`, assigns the configured default estimator, sets `estimateRequestedAt = now()`. Low-confidence extractions set `needsReview = true` instead of guessing. `sourceEmailId` uniqueness makes a redelivered webhook a no-op rather than a duplicate.

**Estimate submission** — `PATCH /tenders/:id/estimate`, restricted to `Tenders` permission, writes `contractSum`, `estimatedById`, `estimatedAt`, and an `AuditLog` row every time — including later edits by Maria/Rob, so there's always a trail of who changed the number and when.

**2-day reminder automation** — n8n's daily schedule calls `GET /integrations/tenders/pending-estimates`, which returns tenders where `contractSum IS NULL AND estimateRequestedAt <= now() - 2 days AND lastReminderSentAt` is either null or not today. n8n sends the email, then calls the mark-reminded endpoint.

**Dashboard snapshot** — `GET /tenders/snapshot` is intentionally a thin, fast endpoint (small `take`, sorted by `dueDate`) rather than the full list endpoint, since the dashboard widget only needs a handful of rows — this is the one piece of "Dashboard module" work pulled forward into Phase 1, because the widget is meaningless without it.

---

## 7. Testing Plan

- [ ] Unit — `tenders.service.ts`: `contractSum` stripped for non-permitted role, kept for permitted role
- [ ] Unit — soft-delete blocked when `isSigned = true`
- [ ] Unit — status transition to `WON` sets `isSigned = true`
- [ ] Unit — due-soon/overdue computation at boundary values (exactly 2 days, exactly on due date)
- [ ] Unit — `tenders-automation.service.ts` with `ClaudeService` mocked: low-confidence response sets `needsReview`, well-formed response creates a clean tender
- [ ] Unit — repeated `sourceEmailId` on intake is a no-op, not a duplicate row
- [ ] e2e (supertest) — every endpoint in §5 with a valid JWT lacking `Tenders` permission returns `403`
- [ ] e2e — n8n endpoints reject requests missing/with-wrong `X-N8N-Secret`
- [ ] e2e — `POST /tenders` with a negative `contractSum` or a missing required field returns `400` with field-level errors

---

## 8. Milestone Checklist (build in this order)

**A. Foundation** — §1 in full, health check passing, CI green on an empty repo.

**B. Auth spine** — §2.1 guards/decorators wired and unit-tested against a dummy protected route, before any Tenders code exists.

**C. Schema** — §3 migrated against a local Supabase instance, seed script runs, Prisma client generated.

**D. Tenders CRUD** — `POST/GET/PATCH/DELETE /tenders`, soft delete + restore, status endpoint, all with DTOs and guards from B.

**E. RBAC + audit on Tenders** — `contractSum` gating, `AuditLog` writes on every mutation, permanent-delete admin-only path.

**F. Automation** — Gmail intake endpoint + Claude parsing, estimate endpoint, pending-estimates + mark-reminded, snapshot endpoint. n8n workflows built and pointed at these three service endpoints.

**G. Hardening** — §7 tests passing, rate limits tuned, Supabase RLS confirmed per §2.2, Swagger docs reviewed.

**Definition of done for Phase 1:** every checkbox above ticked, `BUILD_PLAN.md`'s "Tender Register" and "Backend API Integration" sections for Tenders specifically can be un-blocked on the frontend side, and the three flow diagrams from the earlier architecture discussion (intake → notify → estimate → dashboard, plus the reminder loop) are all live end-to-end against a real (not seed) database.

---

## 9. Open Questions (Ask, Don't Assume — per `PROJECT.md` §8)

- Real `TENDER_STATUSES` values — pull from source before finalizing the Prisma enum
- Does `contractSum` hiding need to be a distinct permission from general `Tenders` access, or is "has Tenders permission" really the right line?
- Confirm reminder/notification email channel: transactional provider vs. n8n-sent-via-Gmail
- Default estimator assignment: single configured user for now, or does Rob want this configurable per trade/project from day one?
