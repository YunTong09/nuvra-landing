# Frontend (`src/`)

This folder contains the React website. Components display pages and send requests to the backend; they do not read or write the database directly.

| Part | Responsibility |
| --- | --- |
| `main.tsx`, `App.tsx` | Start React and select the landing, auth, dashboard, employee, or admin page from the URL. |
| `lib/http.ts` | Shared API base URL, HTTP requests, and session credentials. |
| `lib/api-response.ts` | Parses API responses, preserves backend validation messages, and shows readable errors when hosting returns plain text or HTML. |
| `features/account/auth.ts`, `useCurrentUser.ts` | Account types, current-user lookup, and role-based **My space** destination. |
| `features/employee/EmployeePage.tsx` | Employee workspace, session checks, logout, and shared request management. |
| `features/account/WorkspaceIdentity.tsx`, `workspace.css` | Staff role/name/email header and distinct Admin/Employee dark themes. |
| `features/*/api.ts`, `features/*/types.ts` | Feature-specific endpoints and record types. |
| `index.css`, `styles/` | Stylesheet entry point and separate site, admin, and account styles. |
| `data/companyData.ts` | Landing-page copy and navigation data. |
| `components/` | Sections and feature views for the website. |

The landing page uses `Hero`, `About`, `Services`, `Benefits`, `Stats`, `CTA`, and `Footer`; `Navbar` provides navigation. `AuthPage` handles registration and login. `AccountPage` and `AccountDetailsForm` provide the signed-in customer's dashboard and editable account details. `Admin`, `ClientsAdmin`, and `SubscriptionsAdmin` display the staff management views. `Services` loads public tools, while `CTA` submits an inquiry.

Visitors see login and registration links on the landing page; signed-in users see **My space**. The UI redirects users according to their role, but the backend is responsible for permission checks. The dashboard retrieves account details from the API and saves name or email changes to the database; customer self-service subscriptions are not implemented.

## Customer requests module

`features/requests/RequestsPanel.tsx` loads the history and coordinates the feature. `RequestForm.tsx` submits requests, `RequestList.tsx` displays and selects them, and `RequestDetails.tsx` loads details and provides the employee/administrator status editor. `api.ts` contains the request endpoints; `requests.css` keeps feature styling separate. Shared types and status labels live in `shared/requests.ts` at the project root.

The customer dashboard shows a read-only `AccountOverview` and request history. **Edit profile** opens `/account/edit`; **Submit a new request** opens `/requests/new`, where `NewRequestPage` shows the form and submission confirmation. The admin Requests tab and `/employee` workspace use the same list and details components with status management enabled. `features/employee/EmployeePage.tsx` owns the employee page, while `shared/roles.ts` defines roles and request-management permissions. Backend checks enforce ownership and role permissions independently of these UI controls.

## Employee and staff identity modules

See the [Employee module](features/employee/README.md) for the page and its shared dependencies, and [Account module](features/account/README.md) for the identity component, workspace themes, and account helpers. The employee profile editor retains the employee theme. Shared role definitions are documented in [shared modules](../shared/README.md).

`App.tsx` selects the employee page by URL. The root `vercel.json` serves the React entry page for direct employee-page visits; it is deployment rewrite configuration, not a separate frontend router.

## Tools management module

`features/tools/ToolsAdmin.tsx` contains the tool list, add/edit form, and CRUD operations previously inside `components/Admin.tsx`. `Admin.tsx` retains access checks, logout, navigation, and feature selection. See [Tools module](features/tools/README.md) for details.

## Clients and subscriptions modules

`features/clients/` and `features/subscriptions/` each separate the management container, form, records table, and API calls. `components/Admin.tsx` imports their management containers to display the selected tab. Forms and lists receive data and callbacks from the container; they do not call the backend directly.

See the [Clients module](features/clients/README.md) and [Subscriptions module](features/subscriptions/README.md) for file responsibilities. Subscription creation loads client and tool choices alongside subscription records.

## Shared HTTP and styles

All frontend network requests use `lib/http.ts`. Feature API modules describe which endpoint to call; the HTTP helper sends JSON, includes session credentials, handles empty responses, and reports API errors. Account/session helpers live in `features/account/auth.ts`. Tool, client, and subscription record types live in each feature's `types.ts`.

`index.css` imports `styles/site.css`, `styles/admin.css`, and `styles/account.css` in that order, preserving existing cascade behaviour. Request-specific styles remain in `features/requests/requests.css`.
