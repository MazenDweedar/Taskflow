<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

# TaskFlow

A full-stack Kanban-style task management application built with **Next.js 16** and **NestJS 11**. Organize your work into projects, create and prioritize tasks, and visually manage your workflow with an intuitive drag-and-drop board — all wrapped in a sleek, dark-themed UI that works beautifully on both desktop and mobile.

---

**live 🔗 :** [https://taskflow-delta-rosy.vercel.app](https://taskflow-delta-rosy.vercel.app/)

---

## 🔑 Demo Credentials

If you ran the seed script, you can log in with the following demo account:
- **Email:** `demo@taskflow.dev`
- **Password:** `demo1234`

---

## ✨ Features

- **Kanban Board** — Drag-and-drop tasks between To Do, In Progress, and Done columns
- **Project Management** — Create, edit, and delete multiple projects with isolated task boards
- **Task Priorities** — Assign Low, Medium, or High priority with color-coded badges
- **Search & Filter** — Instantly search tasks by title and filter by priority level
- **Authentication** — Secure cookie-based JWT authentication with registration and login
- **Responsive Design** — Mobile-first layout with swipeable Kanban columns, touch-optimized drag handles, and a sliding sidebar
- **Custom UI System** — Themed toast notifications and confirmation modals (no native browser popups)
- **Dark Theme** — A carefully crafted dark color palette designed for extended use


---

## 🏗️ Architecture

TaskFlow is organized as a monorepo with two independent applications:

```
task-flow/
├── apps/
│   ├── api/          # NestJS backend (REST API)
│   └── web/          # Next.js frontend (App Router)
├── LICENSE
└── README.md
```

### Backend (`apps/api`)

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11 |
| Database | PostgreSQL with TypeORM |
| Authentication | Passport + JWT (HTTP-only cookies) |
| Validation | class-validator + class-transformer |
| API Docs | Swagger (auto-generated) |

### Frontend (`apps/web`)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Drag & Drop | dnd-kit |
| Font | Inter (Google Fonts) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14 (local instance or a hosted service like [Neon](https://neon.tech))

### 1. Clone the Repository

```bash
git clone https://github.com/MazenDweedar/Taskflow.git
cd Taskflow
```

### 2. Set Up the Backend

```bash
cd apps/api
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=taskflow

# JWT
JWT_SECRET=your-secure-random-string
JWT_EXPIRY=7d

# Cookie
COOKIE_SECRET=another-secure-random-string

# App
PORT=3001

# CORS
FRONTEND_URL=http://localhost:3000
```

Run migrations and seed demo data:

```bash
npm run migration:run
npm run seed
```

Start the development server:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3001`. Swagger docs are at `http://localhost:3001/api/docs`.

### 3. Set Up the Frontend

```bash
cd apps/web
npm install
```

Create a `.env` file:

```bash
cp .env.example .env
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 📡 API Overview

All endpoints are prefixed with `/` and protected by JWT authentication (except auth routes).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create a new account |
| `POST` | `/auth/login` | Sign in and receive a JWT cookie |
| `POST` | `/auth/logout` | Clear the auth cookie |
| `GET` | `/auth/me` | Get the current user profile |
| `GET` | `/projects` | List all projects for the current user |
| `POST` | `/projects` | Create a new project |
| `GET` | `/projects/:id` | Get a single project |
| `PATCH` | `/projects/:id` | Update a project |
| `DELETE` | `/projects/:id` | Delete a project and all its tasks |
| `GET` | `/projects/:id/tasks` | List tasks (supports `?search=` and `?priority=`) |
| `POST` | `/projects/:id/tasks` | Create a task |
| `PATCH` | `/tasks/:id` | Update a task (title, description, status, priority) |
| `DELETE` | `/tasks/:id` | Delete a task |

*Visit Swagger at: `http://localhost:3001/api/docs`*

---

## 🚀 Deployment

TaskFlow is designed to be deployed as two separate services:

| Component | Platform |
|-----------|----------|
| Backend API | Railway |
| Frontend | Vercel |
| Database | Neon |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built by <a href="https://github.com/MazenDweedar">Mazen Dweedar</a>
</p>