# Employee workspace

| File | Responsibility |
| --- | --- |
| [EmployeePage.tsx](EmployeePage.tsx) | Owns the employee page, checks the current account, redirects other roles, handles logout, and composes shared identity/profile components and Requests/Projects views. |

`EmployeePage.tsx` provides the `/employee` page for the `employee` role. It checks the current session, redirects other roles to their own workspace, and reuses `AccountOverview` and the request feature components. Employees can edit their own profile, search all customer requests, and update request statuses. The content navigation also opens Projects at `/employee?section=projects`, with Overview statistics and My projects status controls. Only assigned projects are visible; employees cannot create/delete projects or change client/member assignments.

`RequestsPanel` exposes the shared management UI through its `canManageRequests` prop. This controls presentation only: the backend independently checks the database-backed role using `shared/roles.ts`. Tools, Clients, and Subscriptions management remains restricted to administrators. Public registration creates customers; employee access is granted with the trusted `employee:grant` command.

## Shared files and routing

| File | Used for |
| --- | --- |
| [../account/WorkspaceIdentity.tsx](../account/WorkspaceIdentity.tsx) | Displays **Regular Employee**, the name, and email in the header. |
| [../account/workspace.css](../account/workspace.css) | Provides the employee navy/blue theme through `staff-workspace--employee`, including the profile editing page. |
| [../account/auth.ts](../account/auth.ts) | Retrieves the account and sends employees to `/employee` through **My space**. |
| [../../components/AccountOverview.tsx](../../components/AccountOverview.tsx) | Shows profile details and the edit-profile link. |
| [../requests/RequestsPanel.tsx](../requests/RequestsPanel.tsx) | Loads requests and composes the shared search, list, details, and status editor. |
| [../projects/ProjectsWorkspace.tsx](../projects/ProjectsWorkspace.tsx) | Embeds project Overview and My projects using the shared [Projects module](../projects/README.md); backend permissions remain authoritative. |
| [../../App.tsx](../../App.tsx) | Selects `EmployeePage` for the `/employee` URL. |
| [../../../vercel.json](../../../vercel.json) | Rewrites direct `/employee` and `/employee/` visits to the React entry page on Vercel. This is hosting configuration, not a separate frontend router module. |

For server permissions, schema upgrades, and the employee grant command, see [backend documentation](../../../server/README.md#task-9--employee-access).
