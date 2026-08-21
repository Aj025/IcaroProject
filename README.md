# Icaro Projects Backend

Backend API for the Icaro Projects construction operations platform.

**Port:** `3000` (configurable via `PORT` environment variable)

## Tech Stack

### Runtime
- [NestJS](https://nestjs.com/) 11 — Node.js framework
- [Prisma](https://www.prisma.io/) 7 — ORM (PostgreSQL via `@prisma/adapter-pg`)
- [PostgreSQL](https://www.postgresql.org/) 16 — Database
- [Passport](https://www.passportjs.com/) + JWT — Authentication (`@nestjs/passport`, `passport-jwt`)
- [Swagger](https://swagger.io/) — API docs (`@nestjs/swagger`)
- [Helmet](https://helmetjs.github.io/) — Security headers
- [Compression](https://github.com/expressjs/compression) — Response compression
- [class-validator](https://github.com/typestack/class-validator) — Request validation
- [class-transformer](https://github.com/typestack/class-transformer) — Object transformation
- [bcryptjs](https://github.com/nicolo-ribaudo/bcryptjs) — Password hashing
- [Dropbox SDK](https://github.com/dropbox/dropbox-sdk-js) — Dropbox integration
- [Nodemailer](https://nodemailer.com/) — Email (Brevo SMTP)
- [n8n](https://n8n.io/) — Workflow automation (webhooks)

### Dev
- [TypeScript](https://www.typescriptlang.org/) 5 (ESM, `nodenext`)
- [Jest](https://jestjs.io/) 30 — Testing
- [ESLint](https://eslint.org/) 9 — Linting
- [Prettier](https://prettier.io/) — Formatting

## Scripts

```bash
# Development
npm run start:dev          # Start with watch mode
npm run start:debug        # Start with debug

# Build & Type Check
npm run build              # Build production bundle
npm run typecheck          # TypeScript type check

# Lint & Format
npm run lint               # ESLint fix
npm run format             # Prettier format

# Tests
npm test                   # Unit tests
npm run test:e2e           # End-to-end tests

# Prisma
npx prisma generate        # Generate Prisma client
npx prisma validate        # Validate schema
npx prisma migrate dev     # Run migrations
npm run prisma:seed        # Seed database
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `N8N_WEBHOOK_SECRET` | n8n webhook authentication |
| `CLAUDE_API_KEY` | Claude API key |
| `BREVO_API_KEY` | Brevo (transactional email) API key |
| `EMAIL_FROM` | Sender email address |
| `DROPBOX_CLIENT_ID` | Dropbox OAuth client ID |
| `DROPBOX_CLIENT_SECRET` | Dropbox OAuth client secret |
| `DROPBOX_ACCESS_TOKEN` | Dropbox access token |
| `DROPBOX_REFRESH_TOKEN` | Dropbox refresh token |
| `CORS_ORIGIN` | Allowed origins (comma-separated) |
| `PORT` | Server port (default: `3000`) |
| `NODE_ENV` | Environment (`development`/`production`) |

## Project Structure

```
src/
├── modules/
│   ├── auth/           # Authentication (Supabase JWT, login)
│   ├── communication/  # Email/communication features
│   ├── dashboard/      # Dashboard layout & catalog config
│   ├── emails/         # App email management
│   ├── health/         # Health check endpoint
│   ├── integrations/   # External integrations (Dropbox)
│   ├── suppliers/      # Supplier management & compliance
│   └── tenders/        # Tender management & automation
├── common/
│   ├── guards/         # AuthGuard, PermissionsGuard, RolesGuard, N8nSecretGuard
│   ├── filters/        # HttpExceptionFilter
│   └── interceptors/   # AuditLogInterceptor
├── prisma/             # PrismaService (PrismaClient)
├── config/             # Environment validation & configuration
└── main.ts             # Application entry point
```

## Key Features

- **RBAC** — Role-based access control (admin, estimator, pm) enforced per request
- **Audit Logging** — Track all data changes inline
- **Tender Automation** — Automated tender workflow with n8n webhooks
- **Supplier Compliance** — Track RAMS, insurance, CIS status with Dropbox integration
- **Swagger Docs** — Available at `/docs` when server is running
- **Health Checks** — `GET /health` endpoint via `@nestjs/terminus`

## Gotchas

- **ESM Imports** — All relative imports must end in `.js` even for `.ts` files (e.g., `./tenders.service.js`)
- **Prisma Generate** — Run `npx prisma generate` after schema changes or fresh checkout (`generated/` is gitignored)
- **CORS Methods** — Only `GET, POST, PATCH, DELETE` are allowed (use `PATCH` for updates, not `PUT`)
- **Seed Users** — Creates `rob@icaroprojects.com`, `maria@icaroprojects.com`, `pm@icaroprojects.com` (password: `password123`)

## CI

GitHub Actions workflow (`.github/workflows/backend.yml`):

```
npx prisma validate → npm run typecheck → npm run lint → npm run build → npm test
```
