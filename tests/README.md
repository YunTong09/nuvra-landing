# Tests (`tests/`)

These tests exercise backend behaviour with temporary or in-memory data. They verify API responses and database rules without changing the normal local `server/voltix.db` records.

| Test | What it checks |
| --- | --- |
| `auth.test.ts` | Registration validation, login, sessions, logout, login limits, and admin access with SQLite. |
| `postgres-access.test.ts` | Session and administrator checks on the PostgreSQL API path. |
| `tools.test.ts` | Public tool reads, admin tool writes, validation, persistence, and inquiries. |
| `relationships.test.ts` | Client and subscription operations and database constraints. |
| `vercel-routing.test.ts` | Original API path handling through the Vercel rewrite. |

Run `npm test` from the project root. `npm run build` checks TypeScript and produces the frontend build; `npm run lint` checks code style and common errors. These tests do not prove that the current Vercel deployment or Neon environment settings are working; those require a live check after deployment.
