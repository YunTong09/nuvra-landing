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

## Task 6 — Service Management user guide

Nuvra's company services are labelled **Tools** in the website and management area.

### Administrator access

Open `/admin` on the submitted website. If you are not logged in, you will be redirected to `/login`. Sign in with the test administrator account, then open `/admin` or select **My space** to access the management area.

**Test administrator email and password:** to be provided privately with the assignment submission. Credentials are not published in this README. A newly registered customer account does not have administrator permissions.

### Managing services

1. Open the **Tools** tab to view all available services.
2. To create a service, select **+ Add Tool**, enter a title and description, and select **Save Tool**.
3. To update a service, select **Edit**, change its details, and select **Save Tool**.
4. To remove a service, select **Delete** and confirm. If the service is linked to a subscription, remove that subscription from the **Subscriptions** tab first.
5. Select **Website →** to return to the public website and view the **OUR TOOLS** section. If the website is already open in another tab, refresh that tab to see the changes.
6. Select **Log out** when finished in the management area.

The public website retrieves services from the backend through `GET /api/tools`, which reads the database. Saved changes appear on the next page load or refresh without editing website code or redeploying. An already-open public page does not update live. The backend restricts service creation, updates, and deletion to administrators.

For folder details, see [frontend](src/README.md), [backend](server/README.md), and [tests](tests/README.md).
