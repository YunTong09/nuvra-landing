# Frontend (`src/`)

This folder contains the React website. Components display pages and send requests to the backend; they do not read or write the database directly.

| Part | Responsibility |
| --- | --- |
| `main.tsx`, `App.tsx` | Start React and select the landing, auth, dashboard, or admin page from the URL. |
| `api.ts`, `auth.ts`, `useCurrentUser.ts` | API requests, record types, current-user lookup for landing-page links, and role-based **My space** destination. |
| `index.css` | Shared responsive styling. |
| `data/companyData.ts` | Landing-page copy and navigation data. |
| `components/` | Sections and feature views for the website. |

The landing page uses `Hero`, `About`, `Services`, `Benefits`, `Stats`, `CTA`, and `Footer`; `Navbar` provides navigation. `AuthPage` handles registration and login. `AccountPage` shows a signed-in customer's own basic dashboard. `Admin`, `ClientsAdmin`, and `SubscriptionsAdmin` display the staff management views. `Services` loads public tools, while `CTA` submits an inquiry.

Visitors see login and registration links on the landing page; signed-in users see **My space**. The UI redirects users according to their role, but the backend is responsible for permission checks. The dashboard currently shows account details; customer self-service subscriptions are not implemented.
