# Build Prompt: TaskFlow Backend (NestJS + TypeORM + PostgreSQL)

You are building the **backend API** for TaskFlow, a minimal project & task management app. Follow this spec exactly — it reflects deliberate architectural decisions, not defaults to second-guess. Where the spec is silent, make a reasonable choice and note it in a comment or the README.

## Stack & Structure

- **NestJS** (TypeScript), modular structure: `auth`, `users`, `projects`, `tasks` modules, plus a `common` folder for shared filters/pipes/guards.
- **TypeORM** with **PostgreSQL**. Do NOT use `synchronize: true` — use TypeORM migrations, committed to the repo.
- **class-validator** / **class-transformer** for DTO validation.
- **Swagger** (`@nestjs/swagger`) exposed at `/api/docs`.
- Config via `@nestjs/config`, reading from environment variables. Provide a `.env.example` with every variable used (DB connection, JWT secret, cookie settings, port) and no real secrets.
- This is part of a monorepo living at `apps/api`. Assume `apps/web` (Next.js) exists alongside it and will consume this API from a different origin — configure CORS to allow the frontend's origin **with credentials** (since auth uses a cookie).

## Database Schema

**users**
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` |
| email | varchar(255) | unique, not null |
| password_hash | varchar(255) | not null |
| created_at | timestamptz | not null, default now() |

**projects**
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` |
| name | varchar(255) | not null |
| description | text | nullable |
| owner_id | uuid | FK → users.id, `ON DELETE CASCADE`, not null, indexed |
| created_at | timestamptz | not null, default now() |
| updated_at | timestamptz | not null, default now() |

**tasks**
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` |
| project_id | uuid | FK → projects.id, `ON DELETE CASCADE`, not null, indexed |
| title | varchar(255) | not null |
| description | text | nullable |
| status | **native Postgres enum**: `TODO`, `IN_PROGRESS`, `DONE` | not null, default `TODO`, indexed |
| priority | **native Postgres enum**: `LOW`, `MEDIUM`, `HIGH` | not null, default `MEDIUM` |
| due_date | date | nullable |
| created_at | timestamptz | not null, default now() |
| updated_at | timestamptz | not null, default now() |

Design decisions to preserve (and note in README):
- Cascading deletes on both FKs: a project's tasks and a user's projects have no meaning without their parent, so cascade avoids orphaned rows without manual cleanup logic.
- `status`/`priority` use native Postgres enum types (not varchar + app-only validation) — DB-level integrity, not just API-level.
- Index `users.email` (unique), `projects.owner_id`, `tasks.project_id`, `tasks.status` — these back the app's actual query patterns.

## Auth

- Register: `POST /auth/register` — `{ email, password }` → hash password with **bcrypt**, create user, return `{ id, email, createdAt }` (never return password_hash).
- Login: `POST /auth/login` — `{ email, password }` → verify bcrypt hash, sign a JWT, set it as an **httpOnly cookie** (e.g. `access_token`, `sameSite: 'lax'`, `secure: true` in production, reasonable expiry like 7 days). Return `{ id, email }`.
- Logout: `POST /auth/logout` (auth required) → clear the cookie, return 204.
- Session check: `GET /auth/me` (auth required) → return `{ id, email }` for the current user — the frontend uses this on load to check if a session is active.
- Implement a `JwtStrategy` (passport-jwt) that reads the JWT from the cookie (not the Authorization header — write a custom `cookieExtractor`). Guard all project/task routes with `JwtAuthGuard`. Unauthenticated requests → 401.

## Ownership Rule (critical — apply everywhere)

Every project and task operation must verify the resource belongs to the authenticated user. When a user requests a project/task they don't own, return **404 Not Found** (not 403) — this avoids leaking the existence of other users' data. For tasks, since routes are a mix of nested and flat (see below), ownership is checked by joining task → project → owner_id.

## Endpoints

All routes except `/auth/register` and `/auth/login` require the JWT cookie.

**Projects**
| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/projects` | — | `Project[]`, only the caller's own |
| POST | `/projects` | `{ name, description? }` | `Project` |
| GET | `/projects/:id` | — | `Project` (404 if missing/not owner) |
| PATCH | `/projects/:id` | `{ name?, description? }` | `Project` |
| DELETE | `/projects/:id` | — | 204 |

**Tasks** — list/create nested under project (ownership check happens naturally via the project); read/update/delete flat by task id (ownership checked via task→project join). This mirrors how GitHub/Linear-style APIs are structured and avoids the frontend needing to track "current project id" for single-task actions.
| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/projects/:projectId/tasks` | `?status=&priority=&search=` (all optional, combinable) | `Task[]` |
| POST | `/projects/:projectId/tasks` | `{ title, description?, status?, priority?, dueDate? }` (title required, rest optional with sensible defaults) | `Task` |
| GET | `/tasks/:id` | — | `Task` (404 if missing/not owner) |
| PATCH | `/tasks/:id` | any subset of task fields, including `status` | `Task` |
| DELETE | `/tasks/:id` | — | 204 |

`search` on tasks is a case-insensitive partial match on `title`. Filters are combinable (e.g. `?status=TODO&priority=HIGH&search=login`).

## Validation & Error Handling

- Every DTO uses `class-validator` decorators (`@IsEmail`, `@MinLength`, `@IsEnum`, `@IsOptional`, etc.). Register a global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`.
- Errors should consistently look like:
```json
{ "statusCode": 400, "message": "email must be an email", "error": "Bad Request" }
```
This is Nest's default `HttpException` shape — don't build a custom format, just make sure all thrown exceptions (including ownership 404s) conform to it.

## Migrations & Seed Data

- Generate TypeORM migrations from the entities — do not rely on `synchronize: true` anywhere, including in production config.
- Provide a seed script (e.g. `npm run seed`) that creates one demo user (log the credentials to console, e.g. `demo@taskflow.dev` / a simple password) with 2–3 seeded projects and a handful of tasks across different statuses/priorities, so a reviewer can log in and see content immediately.

## Git Workflow

Commit incrementally as you build — not one final "implement backend" commit. A reviewer reads the commit history, so it should tell the story of how the API was built. Use small, logical, working commits in roughly this order, each with a clear conventional-commit-style message:

1. `chore: scaffold NestJS project structure`
2. `feat: add User, Project, Task entities and initial migration`
3. `feat: implement auth module (register, login, JWT cookie, logout)`
4. `feat: add JwtAuthGuard and cookie-based passport strategy`
5. `feat: implement projects module with ownership checks`
6. `feat: implement tasks module with filtering and search`
7. `feat: add global ValidationPipe and consistent error handling`
8. `docs: add Swagger setup at /api/docs`
9. `feat: add seed script with demo user and sample data`
10. `docs: add README and .env.example`
11. any follow-up fix/refactor commits as needed (`fix: ...`, `refactor: ...`)

Rules:
- Each commit should leave the app in a working (or at least compiling) state where reasonably possible — don't commit deliberately broken intermediate code.
- Don't commit `node_modules`, `.env`, `dist`, or other build artifacts — set up `.gitignore` before the first commit.
- Never commit real secrets, even placeholder-looking ones that resemble production values — use obviously fake values in `.env.example`.
- Keep commit messages specific to what changed, not generic ("add stuff", "wip", "fixes").

## Deliverable Checklist for This Task

- [ ] `auth`, `users`, `projects`, `tasks` modules, each with controller/service/DTOs
- [ ] Entities matching the schema above exactly, with correct relations and cascade behavior
- [ ] Migrations committed (no `synchronize: true`)
- [ ] JWT auth via httpOnly cookie, bcrypt password hashing, `JwtAuthGuard` on protected routes
- [ ] Ownership checks returning 404 on mismatch, on every project/task route
- [ ] Task filtering/search implemented as query params, combinable
- [ ] Swagger UI live at `/api/docs`
- [ ] Global `ValidationPipe`, consistent error shape
- [ ] `.env.example` with every env var used, no secrets committed
- [ ] Seed script producing a working demo login
- [ ] TypeScript strict, lint passes, no dead code
- [ ] `.gitignore` in place before first commit (node_modules, dist, .env)
- [ ] Incremental commit history following the Git Workflow section — no single "final version" commit

Do not add microservices, CQRS, caching layers, or other complexity beyond this spec — the brief explicitly asks for a small, well-explained MVP over an over-engineered one.
