# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NestJS 11 REST API (TypeScript) for a travel agency mobile app. Manages tours, quotations, payments, and users with AI-powered semantic search via pgvector + OpenAI embeddings.

## Commands

```bash
# Development
npm run start:dev        # Watch mode
npm run start:debug      # With debugger

# Build & Production
npm run build            # Compile TypeScript to dist/
npm run start:prod       # Run compiled dist/main.js

# Code Quality
npm run lint             # ESLint with auto-fix
npm run format           # Prettier formatting

# Testing
npm run test             # Unit tests (Jest)
npm run test:watch       # Watch mode
npm run test:cov         # Coverage report
npm run test:e2e         # End-to-end tests
npm run test -- --testPathPattern=tours  # Single module tests

# Database
npm run seed:admin       # Seed default admin user
```

## Architecture

### Request Lifecycle

```
Request → JwtAuthGuard (global) → RolesGuard (global) → Controller → Service → TypeORM → PostgreSQL
```

Global guards are registered in `app.module.ts` providers. Use `@Public()` to bypass JWT on an endpoint. Use `@Roles('admin')` to restrict to admin role.

### Module Structure

Each feature lives in `src/<feature>/` with:
- `<feature>.module.ts` — imports, providers, exports
- `<feature>.controller.ts` — HTTP handlers, route decorators
- `<feature>.service.ts` — business logic
- `dto/` — request/response DTOs (validated via class-validator)
- `entities/` — TypeORM entities

### Key Modules

| Module | Responsibility |
|--------|---------------|
| `auth` | JWT login/logout/refresh, token rotation with reuse detection |
| `usuarios` | User accounts with `admin`/`agente` roles |
| `tours` | Tour CRUD + semantic vector search |
| `embeddings` | OpenAI `text-embedding-3-large` (3072 dims) |
| `pagos-realizados` | Payment records with audit trail |
| `whatsapp` | Notifications via YCloud API |
| `database` | Creates `pgvector` extension on startup |

### Tour Semantic Search Flow

1. **Indexing** — on create/update, `ToursService` generates 2–3 text chunks (resumen, detalles, itinerario) and calls `EmbeddingsService` (OpenAI) for each. Vectors stored in `n8n_vectors` table with JSONB metadata.
2. **Search** — `POST /v1/tours/search` accepts a 3072-dim embedding vector; queries pgvector via cosine distance operator `<=>`.

### Authentication

- Access tokens: 15 min expiry (JWT_SECRET)
- Refresh tokens: 7 day expiry, bcrypt-hashed in DB (JWT_REFRESH_SECRET)
- Reusing a refresh token invalidates all tokens for that user

### Database

- PostgreSQL with pgvector extension
- TypeORM with `synchronize: true` — schema syncs automatically on startup
- `autoLoadEntities: true` — entities auto-discovered from modules

### API

- URI versioning: all routes prefixed with `/v1/`
- CORS fully enabled (origin: true, credentials: true)
- Global `ValidationPipe` with `whitelist: true, transform: true`

## Environment Variables

Required in `.env`:
```
DATABASE_URL        # PostgreSQL connection string (supports pgvector)
OPENAI_API_KEY      # For text-embedding-3-large
JWT_SECRET          # Access token signing
JWT_REFRESH_SECRET  # Refresh token signing
PORT                # Server port (default 3001)
YCLOUD_API_KEY      # WhatsApp provider
YCLOUD_WHATSAPP_FROM # WhatsApp sender number
SEED_ADMIN_EMAIL    # Admin user for seed script
SEED_ADMIN_PASSWORD # Admin user for seed script
```

## Important Files

- `src/main.ts` — bootstrap (versioning, CORS, global pipes)
- `src/app.module.ts` — root module, global guards, TypeORM config
- `src/auth/auth.service.ts` — login, token generation, refresh/rotation logic
- `src/tours/tours.service.ts` — tour CRUD + pgvector search queries
- `src/tours/entities/n8n-vector.entity.ts` — vector entity with custom pgvector transformer
- `src/embeddings/embeddings.service.ts` — OpenAI API integration
