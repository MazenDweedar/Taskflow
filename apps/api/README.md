# TaskFlow API

A minimal, well-structured project & task management REST API built with NestJS, TypeORM, and PostgreSQL.

## Stack

- **NestJS 11** (TypeScript, strict mode)
- **TypeORM** with **PostgreSQL**
- **Passport** + **JWT** (cookie-based auth)
- **bcrypt** for password hashing
- **class-validator** / **class-transformer** for DTO validation
- **Swagger** for API documentation

## Features
- **Project & Task Management**: Full CRUD capabilities for projects and tasks.
- **Kanban Board Drag-and-Drop**: Built-in support for modifying task status via a fluid drag-and-drop kanban interface (Bonus Task Completed).

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+

### Setup

```bash
# Navigate to the API directory
cd apps/api

# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your database credentials

# Create the database
psql -U postgres -c "CREATE DATABASE taskflow;"

# Run migrations
npm run migration:run

# Seed demo data
npm run seed

# Start development server
npm run start:dev
```

The API will be running at `http://localhost:3001`.

Swagger docs are available at `http://localhost:3001/api/docs`.

### Demo Credentials

After running the seed script, you can log in with:

- **Email:** `demo@taskflow.dev`
- **Password:** `demo1234`

## Project Structure

```
apps/api/src/
├── auth/                  # Authentication module
│   ├── dto/               # Register, Login DTOs
│   ├── auth.controller.ts # Auth endpoints
│   ├── auth.service.ts    # Auth business logic
│   ├── auth.module.ts     # Module wiring
│   └── jwt.strategy.ts    # Passport JWT strategy (cookie extractor)
├── users/                 # Users module
│   └── entities/          # User entity
├── projects/              # Projects module
│   ├── dto/               # Create, Update DTOs
│   ├── entities/          # Project entity
│   ├── projects.controller.ts
│   ├── projects.service.ts
│   └── projects.module.ts
├── tasks/                 # Tasks module
│   ├── dto/               # Create, Update, Filter DTOs
│   ├── entities/          # Task entity (with enums)
│   ├── tasks.controller.ts
│   ├── tasks.service.ts
│   └── tasks.module.ts
├── common/                # Shared utilities
│   ├── guards/            # JwtAuthGuard
│   └── decorators/        # CurrentUser decorator
├── migrations/            # TypeORM migrations
├── data-source.ts         # TypeORM CLI data source config
├── seed.ts                # Database seeder
├── app.module.ts          # Root module
└── main.ts                # Bootstrap with CORS, cookies, Swagger, validation
```

## API Endpoints

### Auth (no cookie required for register/login)

| Method | Path             | Description                      |
|--------|------------------|----------------------------------|
| POST   | `/auth/register` | Register a new user              |
| POST   | `/auth/login`    | Login, receive JWT in cookie     |
| POST   | `/auth/logout`   | Clear JWT cookie (204)           |
| GET    | `/auth/me`       | Get current user session         |

### Projects (JWT cookie required)

| Method | Path             | Description                      |
|--------|------------------|----------------------------------|
| GET    | `/projects`      | List user's projects             |
| POST   | `/projects`      | Create a project                 |
| GET    | `/projects/:id`  | Get a project                    |
| PATCH  | `/projects/:id`  | Update a project                 |
| DELETE | `/projects/:id`  | Delete a project (204)           |

### Tasks (JWT cookie required)

| Method | Path                           | Description                                  |
|--------|--------------------------------|----------------------------------------------|
| GET    | `/projects/:projectId/tasks`   | List tasks (filterable: `?status=&priority=&search=`) |
| POST   | `/projects/:projectId/tasks`   | Create a task in a project                   |
| GET    | `/tasks/:id`                   | Get a task                                   |
| PATCH  | `/tasks/:id`                   | Update a task (any subset of fields)         |
| DELETE | `/tasks/:id`                   | Delete a task (204)                          |

**Task filters** are combinable: `?status=TODO&priority=HIGH&search=login`

## Design Decisions

### Cascading Deletes

Both foreign keys use `ON DELETE CASCADE`:
- Deleting a user removes all their projects
- Deleting a project removes all its tasks

This is intentional — a project's tasks and a user's projects have no meaning without their parent. Cascade avoids orphaned rows without manual cleanup logic.

### Native PostgreSQL Enums

`status` (TODO, IN_PROGRESS, DONE) and `priority` (LOW, MEDIUM, HIGH) use **native Postgres enum types**, not varchar with application-only validation. This enforces data integrity at the database level.

### 404 for Ownership Mismatches

When a user requests a resource they don't own, the API returns **404 Not Found** (not 403 Forbidden). This avoids leaking the existence of other users' data.

### Cookie-Based JWT Auth

The JWT is stored in an **httpOnly cookie** (not the Authorization header). This provides:
- CSRF mitigation via `sameSite: 'lax'`
- XSS protection via `httpOnly: true`
- Automatic inclusion in requests without client-side token management

The `JwtStrategy` uses a custom `cookieExtractor` function instead of the default header extractor.

### Mixed Nested/Flat Task Routes

- **List/Create** tasks are nested under `/projects/:projectId/tasks` — ownership check happens naturally via the project
- **Read/Update/Delete** a single task uses `/tasks/:id` — ownership is verified via a `task → project → owner_id` join

This mirrors how GitHub/Linear-style APIs are structured and avoids the frontend needing to track "current project ID" for single-task operations.

### Database Indexes

Strategic indexes back the app's actual query patterns:
- `users.email` (unique) — login lookup
- `projects.owner_id` — listing a user's projects
- `tasks.project_id` — listing tasks per project
- `tasks.status` — filtering tasks by status

### No `synchronize: true`

TypeORM's `synchronize: true` is explicitly disabled. All schema changes go through committed migrations to ensure reproducibility and safety across environments.

## Scripts

| Script                | Description                        |
|-----------------------|------------------------------------|
| `npm run start:dev`   | Start in watch mode                |
| `npm run build`       | Build for production               |
| `npm run start:prod`  | Run production build               |
| `npm run migration:generate -- src/migrations/NAME` | Generate migration |
| `npm run migration:run`    | Run pending migrations         |
| `npm run migration:revert` | Revert last migration          |
| `npm run seed`        | Seed demo data                     |
| `npm run lint`        | Lint with ESLint                   |
| `npm run test`        | Run unit tests                     |

## Environment Variables

See `.env.example` for all required variables:

| Variable       | Description                     | Default          |
|----------------|---------------------------------|------------------|
| `DB_HOST`      | PostgreSQL host                 | `localhost`      |
| `DB_PORT`      | PostgreSQL port                 | `5432`           |
| `DB_USERNAME`  | PostgreSQL user                 | `postgres`       |
| `DB_PASSWORD`  | PostgreSQL password             | —                |
| `DB_NAME`      | Database name                   | `taskflow`       |
| `JWT_SECRET`   | Secret for signing JWTs         | —                |
| `JWT_EXPIRY`   | JWT expiration duration         | `7d`             |
| `COOKIE_SECRET`| Secret for cookie signing       | —                |
| `PORT`         | API server port                 | `3001`           |
| `FRONTEND_URL` | Frontend origin for CORS        | `http://localhost:3000` |
