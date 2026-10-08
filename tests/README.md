# Tests (`tests/`)

These tests exercise backend behaviour with temporary or in-memory data. They verify API responses and database rules without changing the normal local `server/voltix.db` records.

| Test | What it checks |
| --- | --- |
| `deployment-imports.test.ts` | Compiles the API/backend/shared modules to JavaScript and starts the API in plain Node without TypeScript files or loaders, catching deployment import failures. Does not connect to Neon. |
| `api-response.test.ts` | Plain-text/HTML server errors, JSON validation messages, successful responses, and empty logout responses. |
| `admin-search.test.ts` | Tools, Clients, and Subscriptions search results, query validation, literal special characters, access restrictions, and PostgreSQL search parameter binding. |
| `auth.test.ts` | Registration, login, sessions, logout, profile updates, validation, login limits, and admin access with SQLite. |
| `postgres-access.test.ts` | Session/profile checks and employee/admin request permissions and management restrictions through a stub PostgreSQL connection. |
| `employee-access.test.ts` | Employee permissions, blocked role escalation, immediate role changes, and SQLite migration preserving accounts, sessions, requests, and ID sequence. |
| `requests.test.ts` | Submission validation, server-assigned ownership/status, customer isolation, administrator status updates, request details, cross-origin rejection, and persistence. |
| `request-filters.test.ts` | Request filter validation and PostgreSQL parameter binding/ownership conditions through a stub adapter. |
| `tools.test.ts` | Public tool reads, admin tool writes, validation, persistence, and inquiries. |
| `relationships.test.ts` | Client and subscription operations and database constraints. |
| `vercel-routing.test.ts` | Original API path handling through the Vercel rewrite. |

Run `npm test` from the project root. `npm run build` checks TypeScript and produces the frontend build; `npm run lint` checks code style and common errors. These tests do not prove that the current Vercel deployment or Neon environment settings are working; those require a live check after deployment.

Task 8 coverage: `requests.test.ts` exercises real SQLite API searches, combined status/date criteria, literal wildcard characters, date boundaries, invalid queries, and ownership isolation. `request-filters.test.ts` checks date validation and parameter binding through the PostgreSQL adapter using a stub connection; it does not replace a live Neon integration check.

`admin-search.test.ts` checks Tools, Clients, and Subscriptions searches through the SQLite API, empty/no-match results, query validation, literal special characters, and access restrictions. It also checks parameter binding for the shared PostgreSQL search builder.

Task 9 coverage: `employee-access.test.ts` checks employee request access and status updates, forbidden company-record operations, rejected role escalation, immediate session behaviour after a role change, and preservation of existing data during the SQLite role migration. `postgres-access.test.ts` also verifies employee request permissions and management restrictions through the PostgreSQL API with a stub database; a live Neon deployment is not exercised.

Task 11 coverage: the final verification used an isolated in-memory SQLite app with real registration/login and 65 HTTP assertions, plus direct database checks. It covered project CRUD, client/member relationships, Admin/Team Member access, restricted fields, unassigned-project 404 responses, partial updates, valid/default/invalid statuses, invalid relationships, transactional rollback, deduplicated assignments, scoped dashboard counts, employee-option field restrictions, and cascading assignment cleanup. These were temporary test-harness checks, not a new committed test file or additional coverage provided by `npm test`.

The project-route move to `server/features/projects/routes.ts` was checked through both app imports and route registration. A SQLite schema type error was corrected and `npm run build` passed. PostgreSQL schemas/repositories were reviewed for parity; live Neon tests were not run.

Browser checks passed for Admin creation/editing and client/member selection, employee-only status controls and assigned visibility, updated dashboard counts, and empty views. The browser tool timed out on the native delete confirmation, so cancellation/confirmation remains a manual UI check; API deletion and database cleanup passed. Slow-loading and API-error/retry browser states also remain manual checks. These browser checks preceded the final integration into the Admin/Employee workspaces; that integration passed build and targeted wiring checks, and its complete browser workflow should be repeated before submission. Local test servers were stopped, and normal development data was not reset.
