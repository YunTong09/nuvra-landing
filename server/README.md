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
| `grant-employee.ts` | Grants employee access to an existing customer account from a trusted terminal; selects the database and upgrades its role constraint if needed. |
| `promote-admin.ts` | Grants an existing account the admin role from a trusted terminal. |
| `migrate-sqlite.ts` | Copies existing SQLite records into a new Neon database. |

The online API entry point is `../api/index.ts`, which runs the PostgreSQL app as a Vercel Function. The local `voltix.db` file is development data, not source code.

Backend relative imports use `.js` paths so they match the files emitted for the Vercel Node.js runtime. Source files remain TypeScript; local commands use `tsx`. The deployment import test checks that the compiled API can start without TypeScript source files.

Registration always creates a regular user. Authenticated users can read and update their own name and email; only admins can write tools or access client and subscription management APIs. Public visitors can read tools and submit inquiries. Client/subscription records currently belong to the admin workflow and are not linked to customer login accounts.

## Customer requests module

`requests/routes.ts` validates input and enforces ownership and status-update permissions after the existing session middleware. `requests/repository.ts` defines the database operations; `requests/sqlite.ts` and `requests/postgres.ts` implement them. `requests/schema.ts` contains both schemas and is used by normal database initialization.

| Endpoint | Access | Purpose |
| --- | --- | --- |
| `POST /api/requests` | Signed-in user | Submit subject and message; the server assigns owner and Pending status. |
| `GET /api/requests` | Signed-in user | Customers see their own records; employees and administrators see all records. |
| `GET /api/requests/:id` | Owner, employee, or administrator | Read complete request details. |
| `PUT /api/requests/:id/status` | Employee or administrator | Update status using `{ "status": "in_progress" }`. |

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
| `postgres/user-roles.ts` | Updates the users role constraint to accept employees inside the startup transaction. |
| `postgres/contact.ts` | Validates and stores public feedback in the inquiries table. |
| `postgres/tools.ts` | Reads, creates, updates, and deletes services/tools. |
| `postgres/clients.ts` | Reads, creates, updates, and deletes company-managed client records. |
| `postgres/subscriptions.ts` | Manages client–tool subscriptions and retrieves joined client/tool details. |
| `postgres/validation.ts` | Provides shared record-ID conversion and validation. Feature-specific input checks stay with their routes. |
| `postgres/errors.ts` | Converts database constraint errors and malformed JSON into API error responses. |

`postgres.ts` registers authentication before protected feature routes and error handling after them. Request management remains in `requests/`, where its routes are already shared by SQLite and PostgreSQL.

For reading the backend, start with `index.ts`, then `app.ts` (SQLite) or `postgres.ts` (PostgreSQL), and follow the imported feature you are interested in. `promote-admin.ts`, `grant-employee.ts`, and `migrate-sqlite.ts` are manually run maintenance commands, not normal page requests.

## SQLite client and subscription modules

`relationships.ts` is the entry point called by `app.ts`. It first calls `sqlite/schema.ts` to create the client and subscription tables and index, then registers `sqlite/clients.ts` and `sqlite/subscriptions.ts`. Each route module keeps its feature-specific validation and SQL together. `sqlite/validation.ts` contains their shared record-ID check.

The tools table must be initialized before these modules, because subscriptions reference tools. `app.ts` preserves this startup order. The authentication middleware is registered before these routes and still protects client and subscription management.


## Task 8 — Search and Filtering

Search is available in the admin **Requests** tab and the customer dashboard's **My requests** section. Enter part of a subject, request details, or request ID. Administrators can also search customer names and email addresses.

Combine the search with **Status**, **Submitted from**, and **Submitted through**, then select **Search**. Date boundaries use UTC and include both selected days. Select **Clear filters** to reset all criteria. **Refresh requests** reloads the currently applied search. Status updates also re-run the applied query.

Results come from `GET /api/requests?q=routine&status=pending&from=2026-09-01&to=2026-09-30`. Both SQLite and PostgreSQL apply the conditions in the database using parameterized queries. Customers remain restricted to their own requests by their session, regardless of query parameters. Search text is a literal substring; `%` and `_` are not treated as user-supplied wildcard operators.

`RequestSearch.tsx` owns the search form, `RequestsPanel.tsx` loads the results, and `RequestList.tsx` renders them without local filtering. `server/requests/filters.ts` validates query parameters and builds the database conditions. Shared filter types live in `shared/requests.ts`.


### Search across all admin tabs

- **Tools:** search title, description, or tool ID.
- **Clients:** search name, email, or client ID.
- **Subscriptions:** search customer name/email, tool title, subscription status, or subscription ID.
- **Requests:** search request content/ID or customer information, with status and date filters.

Select **Search** to query the backend, or **Clear search** to restore the list. All three additional list endpoints accept `q`: `/api/tools?q=focus`, `/api/clients?q=alice`, and `/api/subscriptions?q=cancelled`. SQLite and PostgreSQL use bound parameters and treat wildcard characters as literal search text. Client and subscription endpoints still require an administrator session.

`src/features/search/SearchBar.tsx` provides the shared keyword-search interface. `server/search.ts` validates the query and builds SQL conditions for these three sections. Request-specific multi-criterion filtering remains in `server/requests/filters.ts`. Subscription form options are loaded without the list search so all clients and tools remain selectable.

## Task 9 — Employee access

| File | Responsibility |
| --- | --- |
| [../shared/roles.ts](../shared/roles.ts) | Shared role type and `canManageRequests` permission check. |
| [grant-employee.ts](grant-employee.ts) | Implements `npm run employee:grant -- email`; grants employee access without demoting admins. |
| [sqlite/user-roles.ts](sqlite/user-roles.ts) | Upgrades the old SQLite users constraint, preserving records, references, indexes/triggers, and the ID sequence. Called by SQLite authentication initialization and the grant command. |
| [postgres/user-roles.ts](postgres/user-roles.ts) | Upgrades the PostgreSQL users role constraint; called by `postgres/schema.ts` inside its transaction and startup lock. |
| [auth-sqlite.ts](auth-sqlite.ts), [auth-postgres.ts](auth-postgres.ts) | Load roles from sessions and enforce administrator-only company-record operations. |
| [requests/routes.ts](requests/routes.ts) | Allows employees/admins to read all requests and update statuses, while enforcing customer ownership. |

The `user`, `employee`, and `admin` roles come from the database-backed session. `shared/roles.ts` defines the role type and the shared request-management permission. Employees and administrators can list/search all requests, read their details, and update status; customers can only read their own requests and cannot change status. Tools writes and all Client/Subscription management remain administrator-only. Profile updates cannot change roles.

`sqlite/user-roles.ts` upgrades the original users table constraint transactionally while preserving user IDs, sessions, requests, and the ID sequence. `postgres/user-roles.ts` upgrades the PostgreSQL constraint within the existing startup transaction and lock. Both upgrades run during normal initialization.

Use `npm run employee:grant -- employee@example.com` after registering the account. `grant-employee.ts` selects PostgreSQL with `DATABASE_URL`, otherwise SQLite with `DATABASE_PATH` (default `server/voltix.db`). It upgrades the schema if needed and only grants the role to customer or existing employee accounts. Run it only in a trusted backend environment against the intended database. It cannot demote administrators.

## Task 10 — File & Document Management

| File | Responsibility |
| --- | --- |
| `documents.ts` | Shared document types, `DocumentRepository`, authenticated upload/list/delete routes, validation feedback, and ownership checks. |
| `document-storage.ts` | File rules and basic content checks, local file storage/removal, private Blob token authorization, signed completion verification, and Blob removal. |
| `sqlite/documents.ts` | Creates, lists, finds, and deletes metadata with user-scoped SQLite queries. |
| `postgres/documents.ts` | Equivalent PostgreSQL operations; creation uses a transaction and advisory lock to avoid duplicate completion records. |
| `sqlite/schema.ts`, `postgres/schema.ts` | Initialize the documents table and owner index using the existing users foreign key. |
| `app.ts`, `postgres.ts` | Register document routes with local or Blob storage respectively; PostgreSQL also registers the signed Blob callback. |

| Endpoint | Access | Purpose |
| --- | --- | --- |
| `POST /api/documents` | Signed-in user | Local: accept one multipart `file` and return metadata with 201. Production: authorize a short-lived direct-upload token. |
| `GET /api/documents` | Signed-in user | Return the session owner's metadata array, or `[]`, with 200. |
| `DELETE /api/documents/:id` | Owner | Delete the stored file/Blob first, then metadata; return 204. |
| `POST /api/documents/blob-callback` | Verified Blob signature | Verify the completed private upload and persist metadata asynchronously. |

`DocumentMetadataInput` contains `original_name`, `stored_name`, `mime_type`, and `file_size`; `DocumentMetadata` adds `id`, `user_id`, and `created_at`. `stored_name` holds the local filename or private Blob URL. Both repositories expose `createDocument`, `getDocumentsByUser`, `getDocumentByIdForUser`, and `deleteDocument`, with compatibility aliases. File binaries are never stored in the database.

Document ownership comes from the existing session, not request body/query values. Missing and foreign-owned documents return the same 404 response. Missing authentication returns 401; invalid IDs or missing files return 400; unsupported files return 415; files over 10 MB (10 MiB) return 413. Supported formats are PDF, DOC, DOCX, and UTF-8 TXT. Storage failures return 503 and database failures return 500. Missing local files do not prevent metadata deletion; failed local metadata creation rolls back the saved file.

Local files live in the Git-ignored `uploads/documents/` directory. Production uses private Vercel Blob direct upload so file bytes do not enter the upload Function request. `BLOB_READ_WRITE_TOKEN` stays server-side; `BLOB_UPLOAD_CALLBACK_URL` optionally sets the HTTPS callback address instead of the Vercel deployment domain. The callback is registered before browser-session middleware and is authenticated by its provider signature. Deployment support is implemented; live deployment testing is not required for Task 10 acceptance.

## Task 11 — Client Project Management Platform

| File | Responsibility |
| --- | --- |
| `features/projects/routes.ts` | Shared project types, repository interface, canonical statuses, input validation, authenticated CRUD routes, role/scoped access, and dashboard counts. Moved from `server/projects.ts` without changing behaviour. |
| `sqlite/projects.ts` | SQLite project reads/writes, joined client/member details, assigned-project queries, and transactional membership replacement. |
| `postgres/projects.ts` | Equivalent PostgreSQL operations, snapshot reads, and row locking for updates/member replacement. |
| `sqlite/schema.ts`, `postgres/schema.ts` | Create project tables, constraints and indexes; migrate earlier status values to canonical values. |
| `auth-sqlite.ts`, `auth-postgres.ts` | Reuse existing session authentication and expose the Admin-only employee-options endpoint. |
| `app.ts`, `postgres.ts` | Register the same project routes with the corresponding repository. Relative imports retain `.js` extensions. |

| Endpoint | Access | Purpose |
| --- | --- | --- |
| `GET /api/projects` | Admin or employee | List all projects for Admin; only assigned projects for employees. |
| `GET /api/projects/dashboard` | Admin or employee | Return scoped `stats` and `projects` from the same repository result. Registered before `/:id`. |
| `GET /api/projects/:id` | Admin or assigned employee | Return project details, client information, member IDs and member details. |
| `POST /api/projects` | Admin | Create a project with its client and initial member assignments. |
| `PATCH /api/projects/:id` | Admin or assigned employee | Admin may edit project fields and assignments; employees may send only `status`. |
| `DELETE /api/projects/:id` | Admin | Delete a project and cascade deletion of its member assignments. |
| `GET /api/users/options` | Admin | Return employee `id`, `name`, `email`, and `role` only for the member selector. |

`projects` stores `id`, `client_id`, `name`, `description`, `status`, `created_at`, and `updated_at`. `client_id` references existing clients. `project_members` uses `(project_id, user_id)` as its primary key, references existing projects/users, cascades project deletion, and restricts user deletion while assigned. Client deletion is restricted while projects reference it. Member lists are deduplicated; project changes and membership replacement are transactional.

Statuses are exactly `Not Started`, `In Progress`, `Completed`, and `On Hold`. Creation defaults to `Not Started`; explicit invalid statuses are rejected, and PATCH preserves omitted fields. Both database schemas enforce the same status set. Dashboard `stats` contains `totalProjects`, `activeProjects` (In Progress only), `completedProjects`, `notStartedProjects`, and `onHoldProjects`; `projects` contains the same accessible records used for counting.

Access comes from the authenticated session, never a request-supplied role or user ID. Missing authentication returns 401, prohibited roles/actions return 403, invalid input/relationships return 400, and missing or unassigned project details/status updates return 404. Employee mixed-field PATCH requests are rejected entirely. Database failures use safe API errors without exposing internals. Frontend visibility is not authorization.