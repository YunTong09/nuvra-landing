# Nuvra

Nuvra is a simple company website for tools that help people organise everyday work. Visitors can learn about the tools and send an inquiry. The platform also has accounts and a small management area.

## Tools and hosting

- **Website:** React, TypeScript, Vite, and CSS.
- **API:** Express on Node.js, deployed as a Vercel Function alongside the website.
- **Database:** Neon PostgreSQL online; SQLite for local development when `DATABASE_URL` is unset.
- **Checks:** TypeScript build, Oxlint, and Node test runner with `tsx`.

The browser calls `/api/*` on the same Vercel site. The API validates requests and accesses the database. Set `DATABASE_URL` in the Vercel project to connect its API to Neon. Local development runs the Vite frontend and the Express backend separately.

## Website direction and current behaviour

Visitors can browse the company website and its tool list, then send an inquiry. A customer can register, log in, log out, and view or update their own name and email in a protected dashboard. **My space** sends customers to `/dashboard`, employees to `/employee`, and administrators to `/admin`.

An administrator can manage tool descriptions, client records, and client–tool subscription records. These client records are managed by staff; they are separate from website login accounts. Customers do not yet choose or change subscriptions themselves. Public registration creates a customer account; administrator access must be granted separately through a trusted backend command or database operation.

The backend validates submitted account data, stores password hashes and sessions in the database, and checks access to management APIs. The browser never connects directly to Neon.

## Administrator access

Open `/admin` and sign in with an administrator account.

Test administrator credentials are provided privately with the assignment submission.

## Task 6 — Service Management

- Administrators can create, view, update, and delete company services, labelled **Tools**.
- Service management is restricted to authorized administrators.
- The public website retrieves services from the backend and database.
- Saved changes appear on the public website on the next page load or refresh.

## Task 7 — Customer Request Management

- Customers can submit service requests and view their own request details and progress.
- Requests are stored in the database with an initial **Pending** status.
- Administrators can review requests and update their status to **Pending**, **In progress**, **Completed**, or **Cancelled**.
- Customers can retrieve the latest status by refreshing their request history.

## Task 8 — Search and Filtering

- Administrators can search Tools, Clients, Subscriptions, and Requests using relevant names, descriptions, emails, or record IDs.
- Customers can search their own requests from the dashboard.
- Requests support combined keyword, status, and submission-date filters.
- Results are retrieved from the backend and database, with options to clear search and filter criteria.

## Task 9 — Role-Based Access

- The existing authentication system supports three roles: **Administrator** (`admin`), **Regular Employee** (`employee`), and **Customer** (`user`).
- Administrators can manage Tools, Clients, and Subscriptions, view all customer requests, and update request statuses.
- Regular employees use `/employee` to view and search all customer requests and update request statuses. They can edit their own profile, but cannot manage Tools, Clients, or Subscriptions.
- Customers can view and update their own profile, submit requests, and view or search only their own requests. They cannot access administrator management operations or update request statuses.
- Before allowing protected operations, the backend validates the session and retrieves the user's role from the database. Missing or invalid sessions return **401**; administrator-only operations attempted by employees or customers return **403**. Customers also receive **403** when attempting to update request statuses. A customer attempting to read another customer's request receives **404**.
- Public registration always creates a customer account. Employee and administrator access are granted separately through trusted backend commands; clients cannot choose their role during registration or profile updates.
- Role and ownership checks are enforced in both the SQLite and PostgreSQL backends. Existing databases are upgraded to accept the employee role while preserving accounts and related records.

To grant employee access, first register a customer account, then run this command in a trusted backend environment against the intended database (`DATABASE_URL` for PostgreSQL, or `DATABASE_PATH` for SQLite):

```sh
npm run employee:grant -- employee@example.com
```

Sign in with that account and open **My space** to reach the employee workspace. The command does not change existing administrator accounts.

For folder details, see [frontend](src/README.md), [backend](server/README.md), and [tests](tests/README.md).
