# Backend (`server/`)

This folder contains the Express API, database setup, and server-only account logic. It validates incoming data and enforces permissions; the frontend must not be trusted to do those checks alone.

| Module | Responsibility |
| --- | --- |
| `index.ts` | Starts the local API. Uses Neon/PostgreSQL when `DATABASE_URL` is set, otherwise local SQLite. |
| `app.ts` | Creates the SQLite Express app, the public inquiry endpoint, and shared error handling. |
| `postgres.ts` | Creates the PostgreSQL schema and routes used by Neon and the Vercel Function. |
| `auth-core.ts` | Shared account validation, password hashing, session-cookie, and request-origin helpers. |
| `auth-sqlite.ts` / `auth-postgres.ts` | Registration, login, logout, profile updates, session lookup, login limits, and role checks for each database. |
| `tools.ts` | Local SQLite tool records and tool management routes. |
| `relationships.ts` | Local SQLite client and subscription records and management routes. |
| `promote-admin.ts` | Grants an existing account the admin role from a trusted terminal. |
| `migrate-sqlite.ts` | Copies existing SQLite records into a new Neon database. |

The online API entry point is `../api/index.ts`, which runs the PostgreSQL app as a Vercel Function. The local `voltix.db` file is development data, not source code.

Registration always creates a regular user. Authenticated users can read and update their own name and email; only admins can write tools or access client and subscription management APIs. Public visitors can read tools and submit inquiries. Client/subscription records currently belong to the admin workflow and are not linked to customer login accounts.

## Customer requests module

`requests/routes.ts` validates input and enforces ownership and status-update permissions after the existing session middleware. `requests/repository.ts` defines the database operations; `requests/sqlite.ts` and `requests/postgres.ts` implement them. `requests/schema.ts` contains both schemas and is used by normal database initialization.

| Endpoint | Access | Purpose |
| --- | --- | --- |
| `POST /api/requests` | Signed-in user | Submit subject and message; the server assigns owner and Pending status. |
| `GET /api/requests` | Signed-in user | Customers see their own records; administrators see all records. |
| `GET /api/requests/:id` | Owner or administrator | Read complete request details. |
| `PUT /api/requests/:id/status` | Administrator | Update status using `{ "status": "in_progress" }`. |

Subjects allow 1–150 characters and messages allow 1–5000 after trimming. Status values are `pending`, `in_progress`, `completed`, and `cancelled`. Invalid input returns 400, missing sessions 401, unauthorized status writes 403, and missing or other customers' details 404. Customer name and email reflect the current account profile. Existing inquiries are not migrated into requests because they have no verified account ownership. The SQLite-to-Neon migration includes customer requests after users.
