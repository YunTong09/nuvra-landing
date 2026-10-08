# Nuvra

## Project Overview

Nuvra is an integrated full-stack company platform with public company and service pages, customer My Space, requests, and document management. Internal Admin and Employee workspaces connect client management, project assignments, and a project dashboard through authenticated APIs and a shared database.

## Main Features

| Area | Features |
| --- | --- |
| Authentication & roles | Session-based registration, login, and logout; protected pages and APIs with backend-enforced Admin, Employee/Team Member, and Customer permissions. |
| Company & services | Public company pages and contact form; Admin management of services (Tools), clients, and subscriptions. Public services load from the backend. |
| Customer My Space | View and edit account details, submit requests, track My Requests, and manage My Documents. |
| Requests | Customers submit and search their own requests; employees and Admins review requests and update their status. Search supports combined status and date filters. |
| Documents | Authenticated PDF, DOC, DOCX, and TXT uploads up to 10 MB; list and delete only your own documents. |
| Clients | Manage existing client records and their subscription/project relationships. |
| Projects | Admins create, read, edit, and delete projects, assign an existing client, and assign/remove employees. Employees see only assigned projects and can update their status, not restricted fields or assignments. |
| Project dashboard | Total, In Progress, Completed, Not Started, and On Hold counts, plus a project overview scoped to the signed-in user's access. |

Project statuses are **Not Started**, **In Progress**, **Completed**, and **On Hold**. Active projects means **In Progress**.

## Technologies Used

- **Frontend:** React, TypeScript, Vite, CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** SQLite for local development/testing; PostgreSQL/Neon for deployment
- **File storage:** Multer with local files; private Vercel Blob for deployment
- **Hosting:** Vercel
- **Checks:** TypeScript, Oxlint, Node test runner with tsx

## Setup & Installation

Use **Node.js 24 LTS** and npm.

1. Clone this repository using its Git clone URL, or extract the submission archive.
2. Open a terminal in the project folder.
3. Install dependencies:

```sh
npm ci
```

For the simplest local setup, leave `DATABASE_URL` unset to use SQLite. The default database is `server/voltix.db`; local documents are stored in `uploads/documents/`. Start commands from the project root.

A fresh database has no login accounts. Register through the application first. Role administration uses the existing `admin:promote` and `employee:grant` scripts; private submission account instructions are kept separately.

## How to Run

Start the backend in one terminal:

```sh
npm run server
```

Start the frontend in another terminal with explicit local document storage:

```sh
VITE_DOCUMENT_UPLOAD_MODE=local npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`. Keep both terminals running. The default backend port is **3001**, and the Vite development proxy forwards `/api` requests to that port. Changing the backend port also requires matching the proxy configuration.

Build and run the existing tests:

```sh
npm run build
npm test
```

## Environment Variables

The minimal local SQLite setup needs no database credentials. Backend variables must be supplied through the shell or hosting environment; `npm run server` does **not** automatically load `.env` files. Vite loads its mode-specific environment files for frontend configuration.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL/Neon connection configuration. When absent, the local backend uses SQLite. |
| `DATABASE_PATH` | Optional local SQLite database path; defaults to `server/voltix.db`. |
| `PORT` | Backend listening port; defaults to `3001`. |
| `VITE_API_URL` | Frontend API base URL; normally unset for the supported same-origin/proxy setup. |
| `VITE_DOCUMENT_UPLOAD_MODE` | `local` for SQLite/local uploads or `blob` for the PostgreSQL/Blob backend. Set explicitly for the intended backend. |
| `BLOB_READ_WRITE_TOKEN` | Server-only credential for private Vercel Blob storage. |
| `BLOB_UPLOAD_CALLBACK_URL` | Optional explicit HTTPS Blob completion callback URL when hosting-derived configuration is unavailable. |

Frontend configuration is baked into builds; rebuild when changing the target environment. Never put server secrets in `VITE_` variables or public documentation.

## Project Structure

| Area | Responsibility |
| --- | --- |
| `src/` | Frontend pages, feature modules, components, and shared HTTP helpers. |
| `server/` | Backend entry points, authentication, and shared API modules. |
| `server/features/` | Feature-specific shared backend modules, including project routes/types. |
| `server/requests/` | Shared request routes and paired database repositories. |
| `server/sqlite/` | SQLite schema and repositories. |
| `server/postgres/` | PostgreSQL schema and repositories. |
| `shared/` | Shared roles and request definitions. |
| `api/` | Vercel backend entry point. |
| `tests/` | Automated regression tests. |

Module details: [Frontend](src/README.md) · [Backend](server/README.md) · [Shared](shared/README.md) · [Tests](tests/README.md).

## Database & Deployment

Local development uses SQLite with local document uploads. Deployment support uses PostgreSQL/Neon and private Vercel Blob, with Vercel SPA rewrites including `/documents`. Match the frontend upload mode to the backend storage environment.

Production support is implemented, but final integration verification focused on local SQLite. Live Neon, Blob callbacks, and deployed browser flows still require environment-specific verification.

## Testing & Validation

Local validation covered authentication, requests, documents, clients, project CRUD, role permissions, dashboard counts, database relationships, and build/startup. Existing regression tests and isolated HTTP integration checks passed. Frontend checks covered authentication error handling and major SPA paths; they do not replace a complete browser walkthrough.

Final manual checks include My Space tabs, project forms and assignments, dashboard presentation, supported document samples, and deployed direct navigation. The integration tests used isolated data without resetting the development database.

## Development History

| Task | Completed features |
| --- | --- |
| **1 — Company Landing Page** | Responsive company website with mobile navigation. |
| **2 — Contact & Inquiry System** | Contact form with validation, database storage, and submission feedback. |
| **3 — Internal Content Management** | Add, view, edit, and delete Tools, Clients, and Subscriptions. |
| **4 — User Registration & Authentication** | Registration, login, logout, and protected access. |
| **5 — Customer Dashboard** | Customers can view and update their own account details. |
| **6 — Service Management** | Admins manage services; the public website displays saved services. |
| **7 — Customer Request Management** | Customers submit and track requests; staff update their progress. |
| **8 — Search & Filtering** | Backend-powered search with combined request status and date filters. |
| **9 — Role-Based Access** | Admin, Employee, and Customer roles with different backend-enforced permissions. |
| **10 — File & Document Management** | Customers upload, view, and delete their own documents in My Space. |
| **11 — Client Project Management Platform** | Admins manage and assign client projects; employees update assigned projects, with progress shown in the dashboard. |
