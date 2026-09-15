# Backend (`server/`)

This folder contains the Express API, database setup, and server-only account logic. It validates incoming data and enforces permissions; the frontend must not be trusted to do those checks alone.

| Module | Responsibility |
| --- | --- |
| `index.ts` | Starts the local API. Uses Neon/PostgreSQL when `DATABASE_URL` is set, otherwise local SQLite. |
| `app.ts` | Creates the SQLite Express app, the public inquiry endpoint, and shared error handling. |
| `postgres.ts` | Creates the PostgreSQL schema and routes used by Neon and the Vercel Function. |
| `auth-core.ts` | Shared account validation, password hashing, session-cookie, and request-origin helpers. |
| `auth-sqlite.ts` / `auth-postgres.ts` | Registration, login, logout, session lookup, login limits, and role checks for each database. |
| `tools.ts` | Local SQLite tool records and tool management routes. |
| `relationships.ts` | Local SQLite client and subscription records and management routes. |
| `promote-admin.ts` | Grants an existing account the admin role from a trusted terminal. |
| `migrate-sqlite.ts` | Copies existing SQLite records into a new Neon database. |

The online API entry point is `../api/index.ts`, which runs the PostgreSQL app as a Vercel Function. The local `voltix.db` file is development data, not source code.

Registration always creates a regular user. Authenticated users can read their own account data; only admins can write tools or access client and subscription management APIs. Public visitors can read tools and submit inquiries. Client/subscription records currently belong to the admin workflow and are not linked to customer login accounts.
