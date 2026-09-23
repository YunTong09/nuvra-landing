# Backend (`server/`)

This folder contains the Express API, database setup, and server-only account logic. It validates incoming data and enforces permissions; the frontend must not be trusted to do those checks alone.

| Module | Responsibility |
| --- | --- |
| `index.ts` | Starts the local API. Uses Neon/PostgreSQL when `DATABASE_URL` is set, otherwise local SQLite. |
| `app.ts` | Creates the SQLite Express app, the public inquiry endpoint, and shared error handling. |
| `postgres.ts` | Assembles the PostgreSQL Express app: middleware, authentication, feature routes, and error handling. Re-exports database initialization for existing callers. |
| `postgres/` | PostgreSQL schema initialization, separate feature routes, ID validation, and database error handling. |
| `auth-core.ts` | Shared account validation, password hashing, session-cookie, and request-origin helpers. |
| `auth-sqlite.ts` / `auth-postgres.ts` | Registration, login, logout, profile updates, session lookup, login limits, and role checks for each database. |
| `tools.ts` | Local SQLite tool records and tool management routes. |
| `relationships.ts` | Initializes and registers the SQLite client/subscription modules. |
| `sqlite/` | Separate client/subscription routes, their table setup, and shared ID validation. |
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

## Understanding the server

The browser sends an HTTP request to the backend. The backend checks the user's session and permissions, validates the input, reads or writes the database, and returns a JSON response. React then uses that response to update the screen. Files here run on the server, not in the visitor's browser.

There are two database implementations because local development can use a SQLite file, while the deployed website uses Neon PostgreSQL. `index.ts` selects PostgreSQL when `DATABASE_URL` is configured and SQLite otherwise. The Vercel entry point in `api/index.ts` uses PostgreSQL.

### Authentication files

`auth` means authentication: identifying the signed-in user. These modules also enforce authorization: deciding what that user may do.

| File | What it does | Database access |
| --- | --- | --- |
| `auth-core.ts` | Shared helpers for validating account input, hashing and verifying passwords, generating session tokens, managing cookies, and checking request origin. | None. |
| `auth-sqlite.ts` | Implements registration, login, logout, profile updates, session lookup, rate limits, and admin checks using SQLite queries. Also creates local authentication tables. | Local SQLite. |
| `auth-postgres.ts` | Implements the same account operations and access checks using PostgreSQL queries. Its tables are initialized by `postgres/schema.ts`. | Neon/PostgreSQL. |

Both database-specific authentication files import helpers from `auth-core.ts`; they do not call each other. A successful login creates a session record and sends a cookie to the browser. Later requests include that cookie so the backend can identify the user. Passwords are stored as hashes, not plain text.

### PostgreSQL modules

| File | Responsibility |
| --- | --- |
| `postgres/schema.ts` | Creates missing tables and indexes, and inserts initial tools only for a newly created tools table. Uses a transaction and startup lock. |
| `postgres/contact.ts` | Validates and stores public feedback in the inquiries table. |
| `postgres/tools.ts` | Reads, creates, updates, and deletes services/tools. |
| `postgres/clients.ts` | Reads, creates, updates, and deletes company-managed client records. |
| `postgres/subscriptions.ts` | Manages client–tool subscriptions and retrieves joined client/tool details. |
| `postgres/validation.ts` | Provides shared record-ID conversion and validation. Feature-specific input checks stay with their routes. |
| `postgres/errors.ts` | Converts database constraint errors and malformed JSON into API error responses. |

`postgres.ts` registers authentication before protected feature routes and error handling after them. Request management remains in `requests/`, where its routes are already shared by SQLite and PostgreSQL.

For reading the backend, start with `index.ts`, then `app.ts` (SQLite) or `postgres.ts` (PostgreSQL), and follow the imported feature you are interested in. `promote-admin.ts` and `migrate-sqlite.ts` are manually run maintenance commands, not normal page requests.

## SQLite client and subscription modules

`relationships.ts` is the entry point called by `app.ts`. It first calls `sqlite/schema.ts` to create the client and subscription tables and index, then registers `sqlite/clients.ts` and `sqlite/subscriptions.ts`. Each route module keeps its feature-specific validation and SQL together. `sqlite/validation.ts` contains their shared record-ID check.

The tools table must be initialized before these modules, because subscriptions reference tools. `app.ts` preserves this startup order. The authentication middleware is registered before these routes and still protects client and subscription management.
