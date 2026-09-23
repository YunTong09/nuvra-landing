# Frontend (`src/`)

This folder contains the React website. Components display pages and send requests to the backend; they do not read or write the database directly.

| Part | Responsibility |
| --- | --- |
| `main.tsx`, `App.tsx` | Start React and select the landing, auth, dashboard, or admin page from the URL. |
| `api.ts`, `auth.ts`, `useCurrentUser.ts` | API requests, record types, current-user lookup for landing-page links, and role-based **My space** destination. |
| `index.css` | Shared responsive styling. |
| `data/companyData.ts` | Landing-page copy and navigation data. |
| `components/` | Sections and feature views for the website. |

The landing page uses `Hero`, `About`, `Services`, `Benefits`, `Stats`, `CTA`, and `Footer`; `Navbar` provides navigation. `AuthPage` handles registration and login. `AccountPage` and `AccountDetailsForm` provide the signed-in customer's dashboard and editable account details. `Admin`, `ClientsAdmin`, and `SubscriptionsAdmin` display the staff management views. `Services` loads public tools, while `CTA` submits an inquiry.

Visitors see login and registration links on the landing page; signed-in users see **My space**. The UI redirects users according to their role, but the backend is responsible for permission checks. The dashboard retrieves account details from the API and saves name or email changes to the database; customer self-service subscriptions are not implemented.

## Customer requests module

`features/requests/RequestsPanel.tsx` loads the history and coordinates the feature. `RequestForm.tsx` submits requests, `RequestList.tsx` filters and selects them, and `RequestDetails.tsx` loads details and provides the administrator status editor. `api.ts` contains the request endpoints; `requests.css` keeps feature styling separate. Shared types and status labels live in `shared/requests.ts` at the project root.

The customer dashboard shows a read-only `AccountOverview` and request history. **Edit profile** opens `/account/edit`; **Submit a new request** opens `/requests/new`, where `NewRequestPage` shows the form and submission confirmation. The admin Requests tab uses the same list and details components with status management enabled. Backend checks enforce ownership and administrator privileges independently of these UI controls.
