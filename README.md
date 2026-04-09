# Task Manager

A full-stack task management application built with **NestJS**, **Prisma**, **PostgreSQL**, and **React + Vite**. Includes **Google OAuth**, **JWT** (httpOnly cookie), a **User** model with per-user tasks, full CRUD, status filtering, pagination, and Docker-based deployment.

### Assignment alignment (1Play Global)

The official brief asks for **Express.js** for the REST API and **React · Node.js · Postgres**. This repo uses **NestJS** on Node.js instead of Express: same HTTP routes and validation goals, with controller/service separation analogous to “routes vs controllers.”

---

## Folder Structure

```
task-manager/
├── server/                  # NestJS API + Prisma
│   ├── src/
│   │   ├── main.ts          # Bootstrap, CORS, ValidationPipe
│   │   ├── app.module.ts    # Root module
│   │   ├── health/          # GET /health
│   │   ├── auth/            # Google OAuth, JWT strategies, JwtAuthGuard
│   │   ├── prisma/          # PrismaModule + PrismaService
│   │   └── tasks/           # TasksModule, Controller, Service, DTOs
│   ├── prisma/
│   │   ├── schema.prisma    # User + Task models
│   │   └── migrations/      # Generated Prisma migrations
│   ├── Dockerfile           # Multi-stage build
│   ├── docker-entrypoint.sh # migrate deploy → node dist/src/main.js
│   └── .env.example
├── client/                  # React + Vite
│   ├── src/
│   │   ├── api/tasks.ts     # Axios API wrapper
│   │   ├── components/      # TaskForm, TaskList, TaskItem, StatusFilter
│   │   ├── pages/Home.tsx   # Main page (state, fetch, callbacks)
│   │   ├── context/         # AuthContext (session via /auth/me)
│   │   └── App.tsx
│   └── .env.example
├── docker-compose.yml       # postgres + api services
├── .env.example             # Docker Compose variables
└── README.md
```

---

## API Routes

**Auth** (no JWT required for Google redirect flow; `/auth/me` requires JWT cookie):

| Method | Route                    | Description                          |
|--------|--------------------------|--------------------------------------|
| GET    | /auth/google             | Start Google OAuth                   |
| GET    | /auth/google/callback    | OAuth callback; sets JWT cookie      |
| GET    | /auth/me                 | Current user (JWT cookie)            |
| GET    | /auth/logout             | Clear JWT cookie                     |

**Health** (public — no JWT):

| Method | Route         | Description                    | Status |
|--------|---------------|--------------------------------|--------|
| GET    | /health       | Liveness check                 | 200    |

**Tasks** (all **`/tasks`** routes require **JWT** — sign in first; tasks are scoped to the authenticated user):

| Method | Route         | Description                    | Status |
|--------|---------------|--------------------------------|--------|
| GET    | /tasks        | List tasks (filter + paginate) | 200    |
| GET    | /tasks/:id    | Get one task                   | 200/404|
| POST   | /tasks        | Create task                    | 201    |
| PATCH  | /tasks/:id    | Partial update                 | 200/404|
| DELETE | /tasks/:id    | Delete task                    | 200/404|

### Query Parameters for `GET /tasks`

| Param  | Type   | Default | Description                       |
|--------|--------|---------|-----------------------------------|
| status | string | —       | Filter: `todo`, `in-progress`, `done` |
| page   | number | 1       | Page number (1-indexed)           |
| limit  | number | 10      | Items per page (max 100)          |

**Response shape:**
```json
{
  "data": [ ...tasks ],
  "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

---

## Environment Variables

| Variable           | Location        | Description                       |
|--------------------|-----------------|-----------------------------------|
| `DATABASE_URL`     | `server/.env`   | Postgres connection string        |
| `PORT`             | `server/.env`   | API port (default `3000`)         |
| `NODE_ENV`         | `server/.env`   | `development` or `production`     |
| `POSTGRES_USER`    | root `.env`     | Docker Compose Postgres user      |
| `POSTGRES_PASSWORD`| root `.env`     | Docker Compose Postgres password  |
| `POSTGRES_DB`      | root `.env`     | Docker Compose Postgres DB name   |
| `VITE_API_BASE_URL`| `client/.env`   | Base URL for Axios (React)        |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | `server/.env` | Web OAuth client from Google Cloud |
| `JWT_SECRET`     | `server/.env`   | Secret for signing JWTs (use a long random string in production) |
| `GOOGLE_CALLBACK_URL` | `server/.env` (optional) | Defaults to `http://localhost:3000/auth/google/callback` |

### Google OAuth — fix `invalid_client` / empty client

Your OAuth client must be type **Web application**. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → open the client → **you cannot leave these blank**:

1. **Authorised JavaScript origins** — add:
   - `http://localhost:3000`
   - `http://localhost:5173` (Vite dev; page that starts the login redirect)

2. **Authorised redirect URIs** — add **exactly** (must match [`google.strategy.ts`](server/src/auth/strategies/google.strategy.ts)):
   - `http://localhost:3000/auth/google/callback`

Click **Save**. Changes can take a few minutes to apply.

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL running locally (or use Docker for the DB only)

**Port 5432 vs 5433:** If you have **PostgreSQL installed on Windows** and **Docker Postgres** at the same time, both cannot use host port `5432` reliably—Prisma may connect to the wrong server and you get **`P1000` Authentication failed**. This repo maps Docker Postgres to host port **`5433`**. Use `DATABASE_URL=...localhost:5433/...` in `server/.env`, or stop the Windows PostgreSQL service while developing.

**Port 3000 — Docker API vs local Nest:** The `api` service in Docker publishes **http://localhost:3000**. Only **one** process can listen on that port. If you keep **`taskmanager_api` running**, use that URL for the client (`VITE_API_BASE_URL=http://localhost:3000`) and **do not** run `npm run start:dev` in `/server` on port 3000 (you will get `EADDRINUSE`). To run Nest locally **with** Docker API still up, set `PORT=3001` in `server/.env` for local dev and set `VITE_API_BASE_URL=http://localhost:3001` when testing the local server.

### 1. Server

```bash
cd server

# Copy and fill env
cp .env.example .env
# Edit DATABASE_URL to point to your local Postgres

# Install deps (already done if you ran npm install)
npm install

# Run first migration
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Optional: insert demo tasks for your Google account (same email as login)
# Add to .env: SEED_USER_EMAIL=you@gmail.com
npm run db:seed

# Start dev server (hot reload)
npm run start:dev
# API available at http://localhost:3000
```

### 2. Client

```bash
cd client

# Copy env
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:3000

npm install
npm run dev
# UI available at http://localhost:5173
```

### 3. Sign in and use the app

1. In **`server/.env`**, set **`GOOGLE_CLIENT_ID`**, **`GOOGLE_CLIENT_SECRET`**, and **`JWT_SECRET`** (see [`server/.env.example`](server/.env.example)) — required for OAuth outside Docker too.
2. Open **http://localhost:5173**, click **Sign in with Google**, complete the redirect; you land on **`/dashboard`** with an httpOnly session cookie.
3. Create and manage tasks from the UI — **`/tasks`** is only available when signed in; data is scoped to your user.

---

## Docker Setup (Postgres + API)

From the **repo root**:

```bash
# Copy env (optional — defaults are built-in)
cp .env.example .env

# Build and start postgres + api
docker compose up --build

# API:      http://localhost:3000
# Health:   http://localhost:3000/health
```

The `api` service automatically runs `prisma migrate deploy` on startup before launching the server.

**OAuth / JWT:** Compose loads **[`server/.env`](server/.env)** into the `api` container (`env_file`). Put `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `JWT_SECRET` there. `DATABASE_URL` inside the container is still overridden to use the `db` service hostname, not `localhost`.

> **Client** is not containerized — run `npm run dev` or `npm run build && npm run preview` in `/client`.

---

## Production Migration

```bash
cd server
npx prisma migrate deploy
node dist/src/main.js
```

Or via Docker entrypoint (automatic on `docker compose up`).

---

## Prisma Studio (browse tables in the browser)

From **`server/`** (with Postgres running — e.g. `docker compose up` from the repo root):

```bash
cd server
npx prisma studio
```

**If you see “Could not load schema metadata”:**

1. **Postgres must be running** — start the stack or at least the `db` container so the mapped host port (default **`localhost:5433`**) accepts connections.
2. **`server/.env`** — set `DATABASE_URL` to match your database. For the default Docker Compose DB use:
   `postgresql://postgres:postgres@localhost:5433/taskmanager`  
   Do not leave `DATABASE_URL` empty.
3. **Bypass `.env`** (quick test):
   ```bash
   npx prisma studio --url="postgresql://postgres:postgres@localhost:5433/taskmanager"
   ```

You can also use **DBeaver** / **pgAdmin** against `localhost:5433` (or `docker exec -it taskmanager_db psql -U postgres -d taskmanager` — no host port issue).

**`ERR_STREAM_PREMATURE_CLOSE` in the terminal:** Often harmless — the browser closed a request early (refresh, tab close) or the UI retried. If Studio still works in the browser, ignore it. If Studio misbehaves, restart with `npx prisma studio --port 5555` or use DBeaver instead.

**“Could not load schema metadata” / `introspect` failed (but Postgres is running):**  
This is a **known Prisma 7.x + PostgreSQL + Prisma Studio** issue (see [prisma/prisma#29280](https://github.com/prisma/prisma/issues/29280) and related issues). The database and your app can be fine; **Studio’s introspection step** sometimes fails on Windows. Your data is still in Postgres.

**Reliable ways to view data (no Prisma Studio):**

1. **Docker + `psql`** (if the DB container is named `taskmanager_db`):

   **Windows PowerShell** — use **single quotes** around the whole SQL so `"Task"` is preserved. Do **not** use `\"` inside double quotes (that causes `unterminated quoted identifier`).

   ```powershell
   docker exec -it taskmanager_db psql -U postgres -d taskmanager -c 'SELECT * FROM "Task";'
   ```

   **Git Bash / macOS / Linux:**

   ```bash
   docker exec -it taskmanager_db psql -U postgres -d taskmanager -c 'SELECT * FROM "Task";'
   ```
2. **DBeaver** (free): new connection → PostgreSQL → host `localhost`, port **`5433`** (Docker host mapping; use `5432` only for a native Postgres install), database `taskmanager`, user `postgres`, password `postgres` (or your `.env` values) → browse **Tables** → `Task`.
3. **pgAdmin** — same connection settings as above.

---

## Assumptions & Trade-offs

- **Authentication** — **Google OAuth** with **JWT** in an **httpOnly** cookie. The React app uses **`withCredentials: true`** so the cookie is sent on API calls. **`/tasks`** routes are protected with `JwtAuthGuard`.
- **User model** — Prisma **`User`** (OAuth provider + `providerId`, email, etc.) with a one-to-many relation to **`Task`** via **`userId`**. List/create/update/delete only touch tasks belonging to the signed-in user.
- **`status` is a plain string** validated in DTOs (not a Prisma enum) for API/UI alignment simplicity.
- **Pagination metadata** returned as `{ data, meta }` — documented above.
- **Client not containerized** — static hosting or `npm run preview` is sufficient for a smoke test.
- **CORS** allows `localhost:5173` and `localhost:4173` (Vite dev + preview) with **credentials** enabled for cookie auth.

---

## What I Would Improve With More Time

1. **Optimistic UI** — instant local updates before server confirmation.
2. **Search** — full-text title/description search endpoint.
3. **Due-date reminders** — notification system or email digest.
4. **Drag-and-drop reordering** — Kanban-style board view.
5. **E2E tests** — Playwright for the full UI flow.
6. **CI/CD** — GitHub Actions pipeline: lint → test → build → push Docker image.
7. **Containerise the client** — serve built React via Nginx in Docker Compose.
