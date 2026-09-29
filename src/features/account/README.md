# Account helpers

| File | Responsibility |
| --- | --- |
| [auth.ts](auth.ts) | Defines `CurrentUser` using the shared role type, retrieves the current session, and selects `/dashboard`, `/employee`, or `/admin` through `spacePath`. |
| [WorkspaceIdentity.tsx](WorkspaceIdentity.tsx) | Shared staff header component displaying the signed-in role, name, and email. Imports the workspace stylesheet. |
| [workspace.css](workspace.css) | Scoped staff backgrounds, role badges, header layout, dark forms and cards, focus styles, and mobile layout. Uses charcoal/mint for Admin and navy/blue for Employee. |

`auth.ts` defines the current-user type, looks up the signed-in account, and chooses the customer, employee, or administrator workspace URL. It uses `src/lib/http.ts` for network requests. Account page and form components currently remain in `src/components/`.

These browser helpers do not verify passwords or grant permissions. The backend authentication modules perform those checks.

`WorkspaceIdentity.tsx` displays the signed-in staff role, name, and email. `workspace.css` scopes shared dark workspace styles to staff pages: charcoal/mint for administrators and navy/blue for employees, including the employee profile editor.

`components/Admin.tsx`, `features/employee/EmployeePage.tsx`, and the employee profile view in `components/AccountPage.tsx` use the shared identity component and workspace classes. Role definitions and backend request-management permissions are documented in [shared modules](../../../shared/README.md).
