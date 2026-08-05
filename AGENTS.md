# AGENTS.md — Icaro Projects Backend (NestJS)

NestJS 11 + Prisma 7 + PostgreSQL 16, ESM. This folder is the entire repo (single package).

## Stack
NestJS 11 · TypeScript 5 (ESM, `nodenext`) · Prisma 7 (PostgreSQL via `@prisma/adapter-pg`) · Swagger (`/docs`) · passport-jwt · throttler · nodemailer (SMTP) · Dropbox SDK · n8n webhooks (X-N8N-Secret) · Supabase-signed JWTs · class-validator (global whitelist)

## Commands
- Install then generate the DB client (required or nothing compiles — `generated/` is gitignored):
  `npm install` → `npx prisma generate`
- Run: `npm run start:dev` (`--watch`); Swagger at `http://localhost:3000/docs`
- Verify in CI order: `npx prisma validate` → `npm run typecheck` → `npm run lint` → `npm run build` → `npm test`
  (CI runs exactly this: `.github/workflows/backend.yml`)
- Single unit test: `npm test` (jest, rootDir `src`, `*.spec.ts`). e2e: `npm run test:e2e` (only `test/tenders.e2e-spec.ts`; mocks `PrismaService`, needs no DB).
- DB: `docker compose up postgres` (postgres:16, db/user/pass `icaro`/`icaro`/`icaro_dev_pass`). Copy `.env.example` → `.env`.
- Schema changes: edit `prisma/schema.prisma`, then `npx prisma generate` + `npm run prisma:migrate`; after that re-generate + reseed as needed (`npm run prisma:seed`).

## Architecture
- `src/modules/*` are domain modules: `auth`, `communication`, `dashboard`, `health`, `integrations`, `suppliers`, `tenders`. Cross-cutting code lives in `src/common/{guards,filters,decorators,interceptors}`; `src/prisma/prisma.service.ts` is the single `PrismaClient`.
- Prisma 7 driver-adapter pattern: `PrismaService` (`src/prisma/prisma.service.ts`) instantiates `PrismaPg` + `PrismaClient` imported from `../../generated/prisma/client.js` (ESM, `.js` suffix).
- RBAC is enforced **server-side on every request**: role/permissions are re-fetched from the `Profile` table per request, never read from the JWT. Use `AuthGuard`, `PermissionsGuard`, `RolesGuard`.
- Audit logs are written **inline** (direct `prisma.auditLog.create`), per the tenders/suppliers/dashboard convention — there is no shared audit module.

## Gotchas
- Native ESM + `"module": "nodenext"`: all relative imports MUST end in `.js` even for `.ts` files (e.g. `./tenders.service.js`). Missing the suffix breaks both `tsc` and Node.
- You MUST run `npx prisma generate` whenever the schema changes and after a fresh checkout; `generated/` is gitignored so the client is not present by default.
- CORS allow-list is `GET, POST, PATCH, DELETE` (see `src/main.ts`) — use `PATCH` for updates, never `PUT` (dashboard endpoint is intentionally `PATCH /dashboard/layout`, not `PUT`).
- Seed creates `rob@icaroprojects.com`, `maria@icaroprojects.com`, `pm@icaroprojects.com` (password `password123`).
