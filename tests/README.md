# Tests (`tests/`)

These tests exercise backend behaviour with temporary or in-memory data. They verify API responses and database rules without changing the normal local `server/voltix.db` records.

| Test | What it checks |
| --- | --- |
| `auth.test.ts` | Registration, login, sessions, logout, profile updates, validation, login limits, and admin access with SQLite. |
| `postgres-access.test.ts` | Session, profile update, and administrator checks on the PostgreSQL API path. |
| `requests.test.ts` | Submission validation, server-assigned ownership/status, customer isolation, administrator status updates, request details, cross-origin rejection, and persistence. |
| `tools.test.ts` | Public tool reads, admin tool writes, validation, persistence, and inquiries. |
| `relationships.test.ts` | Client and subscription operations and database constraints. |
| `vercel-routing.test.ts` | Original API path handling through the Vercel rewrite. |

Run `npm test` from the project root. `npm run build` checks TypeScript and produces the frontend build; `npm run lint` checks code style and common errors. These tests do not prove that the current Vercel deployment or Neon environment settings are working; those require a live check after deployment.

Task 8 coverage: `requests.test.ts` exercises real SQLite API searches, combined status/date criteria, literal wildcard characters, date boundaries, invalid queries, and ownership isolation. `request-filters.test.ts` checks date validation and parameter binding through the PostgreSQL adapter using a stub connection; it does not replace a live Neon integration check.

`admin-search.test.ts` checks Tools, Clients, and Subscriptions searches through the SQLite API, empty/no-match results, query validation, literal special characters, and access restrictions. It also checks parameter binding for the shared PostgreSQL search builder.

Task 9 coverage: `employee-access.test.ts` checks employee request access and status updates, forbidden company-record operations, rejected role escalation, immediate session behaviour after a role change, and preservation of existing data during the SQLite role migration. `postgres-access.test.ts` also verifies employee request permissions and management restrictions through the PostgreSQL API with a stub database; a live Neon deployment is not exercised.
