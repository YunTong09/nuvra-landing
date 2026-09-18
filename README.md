# Nuvra

Nuvra is a simple company website for tools that help people organise everyday work. Visitors can learn about the tools and send an inquiry. The platform also has accounts and a small management area.

## Tools and hosting

- **Website:** React, TypeScript, Vite, and CSS.
- **API:** Express on Node.js, deployed as a Vercel Function alongside the website.
- **Database:** Neon PostgreSQL online; SQLite for local development when `DATABASE_URL` is unset.
- **Checks:** TypeScript build, Oxlint, and Node test runner with `tsx`.

The browser calls `/api/*` on the same Vercel site. The API validates requests and accesses the database. Set `DATABASE_URL` in the Vercel project to connect its API to Neon. Local development runs the Vite frontend and the Express backend separately.

## Website direction and current behaviour

Visitors can browse the company website and its tool list, then send an inquiry. A customer can register, log in, log out, and view or update their own name and email in a protected dashboard. **My space** sends customers to `/dashboard` and administrators to `/admin`.

An administrator can manage tool descriptions, client records, and client–tool subscription records. These client records are managed by staff; they are separate from website login accounts. Customers do not yet choose or change subscriptions themselves. Public registration creates a customer account; administrator access must be granted separately through a trusted backend command or database operation.

The backend validates submitted account data, stores password hashes and sessions in the database, and checks access to management APIs. The browser never connects directly to Neon.

For folder details, see [frontend](src/README.md), [backend](server/README.md), and [tests](tests/README.md).
