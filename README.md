# FactoryOS Management

FactoryOS is a full-stack factory management platform with multi-tenant authentication, operational modules, and a modern React dashboard UI.

This repository contains:

- `client` - React + Vite frontend
- `server` - Node.js + Express + Prisma backend
- `docker-compose.yml` - PostgreSQL service for local development
- `landing_page` - standalone HTML version of the landing page design

## Tech Stack

### Frontend

- React 19
- Vite 8
- React Router
- Tailwind CSS (via `@tailwindcss/vite`)
- Axios
- Socket.IO client

### Backend

- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT authentication (access + refresh token)
- Socket.IO

## Features

- Multi-tenant auth using factory slug (`tenantSlug`)
- Role-aware authorization middleware
- Production and work-order management
- Dispatch and logistics management
- Employees, attendance, and leave workflows
- Inventory and warehouse operations
- Vendor and purchase order management
- Maintenance and service tickets
- Payroll and reports modules
- Chat module with session + messages API
- Modern landing page and protected app routes

## Project Structure

```text
management/
  client/                 # React frontend
    src/
      pages/              # UI pages (landing, login, dashboard, modules)
      components/         # Shared UI layout components
      context/            # Auth context
      api.js              # Axios instance and token refresh flow
  server/                 # Express API + Prisma
    prisma/
      schema.prisma       # Database schema
    src/
      modules/            # Domain modules (auth, production, etc.)
      middleware/         # authenticate/authorize middleware
      prisma/seed.js      # Seed data
      index.js            # App bootstrap, routes, Socket.IO
  landing_page/
    factoryos_website.html
  docker-compose.yml
```

## Prerequisites

- Node.js 18+ (Node 20+ recommended)
- npm
- Docker Desktop (for PostgreSQL via Docker Compose)

## Environment Setup

Backend env file: `server/.env`

Already expected values:

```env
DATABASE_URL="postgresql://factoryos:factoryos123@localhost:5432/factoryos?schema=public"
JWT_SECRET="factoryos-jwt-secret-change-in-production"
JWT_REFRESH_SECRET="factoryos-refresh-secret-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

## Installation

From repository root:

```powershell
cd client
npm install
cd ..\server
npm install
```

## Database Setup (PostgreSQL)

From repository root:

```powershell
docker compose up -d postgres
```

Then from `server`:

```powershell
npm run db:push
npm run db:seed
```

Seed creates demo tenant and users, including:

- Tenant slug: `surat-textile-mill`
- Owner login: `owner@surattextile.com`
- Password: `Password@123`

## Run the Project

Run backend (default port `5000`):

```powershell
cd server
npm run dev
```

Run frontend (default port `3000`):

```powershell
cd client
npm run dev
```

Open frontend:

- `http://localhost:3000`
- If `3000` is busy, Vite auto-selects next free port (for example `3001`)

## Port Notes

- Frontend Vite dev server is configured for `3000`
- Backend Express server is configured for `5000`
- Vite proxy forwards:
  - `/api` -> `http://localhost:5000`
  - `/socket.io` -> `http://localhost:5000`

If backend runs on another port (example `5001`), update `client/vite.config.js` proxy target accordingly.

## Available Scripts

### Client (`client/package.json`)

- `npm run dev` - start Vite dev server
- `npm run build` - build production bundle
- `npm run lint` - run ESLint
- `npm run preview` - preview production build

### Server (`server/package.json`)

- `npm run dev` - start server with nodemon
- `npm run start` - start server with node
- `npm run db:generate` - Prisma client generation
- `npm run db:push` - push schema to DB
- `npm run db:migrate` - run Prisma migrations in dev mode
- `npm run db:seed` - seed demo data

## API Overview

Base URL: `/api`

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Login expects:

```json
{
  "email": "owner@surattextile.com",
  "password": "Password@123",
  "tenantSlug": "surat-textile-mill"
}
```

### Module Routes

- `/api/production`
- `/api/dashboard`
- `/api/dispatch`
- `/api/employees`
- `/api/inventory`
- `/api/vendors`
- `/api/maintenance`
- `/api/payroll`
- `/api/reports`
- `/api/chat`

## Authentication Flow

- Access token and refresh token are stored in browser `localStorage`
- Client sends `Authorization: Bearer <accessToken>`
- On `401`, client calls `/api/auth/refresh` and retries original request
- Protected frontend routes redirect unauthenticated users to `/login`

## Socket.IO

Server initializes Socket.IO and supports tenant room joins:

- Event: `join-tenant` with tenant id
- Room format: `tenant-<tenantId>`

## Build for Production

Frontend:

```powershell
cd client
npm run build
```

Backend:

```powershell
cd server
npm run start
```

## Troubleshooting

### 1) Database error: `Can't reach database server at localhost:5432`

Cause: PostgreSQL is not running.

Fix:

```powershell
cd C:\Users\Lenovo\management
docker compose up -d postgres
```

Then:

```powershell
cd server
npm run db:push
npm run db:seed
```

### 2) Docker error: cannot connect to `dockerDesktopLinuxEngine`

Cause: Docker Desktop engine is not running.

Fix:

- Start Docker Desktop manually
- Wait until status shows engine running
- Re-run `docker compose up -d postgres`

### 3) Backend port in use (`EADDRINUSE: 5000`)

Run backend on another port:

```powershell
cd server
$env:PORT=5001; npm run dev
```

If you do this, update frontend proxy target in `client/vite.config.js` from `5000` to `5001`.

### 4) Frontend shows `Port 3000 is in use`

Vite automatically switches to another port (for example `3001`). Open the URL printed in terminal.

### 5) Prisma `EPERM ... query_engine-windows.dll.node`

This can happen on Windows when file locks are active. Retry command after stopping active Node processes or terminal sessions:

```powershell
cd server
npm run db:push
```

## Security Notes

- Replace JWT secrets in `server/.env` before production
- Use strong DB credentials
- Restrict CORS origins for production
- Avoid committing real API keys in `.env`

## Current Status

- Landing page integrated into React app root route (`/`) for unauthenticated users
- Login flow active and connected to backend auth APIs
- Full module routing is wired on both frontend and backend

---

If you want, I can also generate:

- `docs/API.md` with endpoint-level request/response examples
- `docs/DEPLOYMENT.md` for production hosting (frontend + backend + DB)
- `docs/ARCHITECTURE.md` with module and data-flow diagrams
