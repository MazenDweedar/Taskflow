# TaskFlow Frontend

This is the Next.js frontend for the TaskFlow application.

## Stack
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS

## Prerequisites
- Node.js 20+
- TaskFlow API running (default `http://localhost:3001`)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Environment Variables:
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Ensure `NEXT_PUBLIC_API_URL` points to your backend.

3. Start Development Server:
```bash
npm run dev
```

The app will run on `http://localhost:3000`.

## Architecture Highlights
- **Cookie-Based Auth**: The frontend relies on the backend to set an `httpOnly` cookie. API client (`lib/api.ts`) always sends `credentials: 'include'`.
- **Route Protection**: Next.js Middleware checks for the presence of the `access_token` cookie for routes like `/projects`. 
- **Session Validation**: The protected layout (`app/(protected)/layout.tsx`) calls `GET /auth/me` to ensure the session is actually valid.
