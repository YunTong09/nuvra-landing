# Employee workspace

`EmployeePage.tsx` provides the `/employee` page for the `employee` role. It checks the current session, redirects other roles to their own workspace, and reuses `AccountOverview` and the request feature components. Employees can edit their own profile, search all customer requests, and update request statuses.

`RequestsPanel` exposes the shared management UI through its `canManageRequests` prop. This controls presentation only: the backend independently checks the database-backed role using `shared/roles.ts`. Tools, Clients, and Subscriptions management remains restricted to administrators. Public registration creates customers; employee access is granted with the trusted `employee:grant` command.
