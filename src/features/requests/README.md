# Customer Requests

This folder contains the frontend for submitting, viewing, and managing customer service requests. Each file has a specific responsibility so that forms, lists, API calls, and styling can be maintained separately.

## Files and responsibilities

| File | Purpose |
| --- | --- |
| `RequestsPanel.tsx` | Loads request history, handles loading and error states, provides refresh controls, and coordinates the request list. Used by both the customer dashboard and the admin Requests tab. |
| `NewRequestPage.tsx` | Displays the submission form on `/requests/new`. After a successful submission, shows the request reference and a link back to the dashboard. |
| `RequestForm.tsx` | Manages the subject and request details fields, placeholder guidance, submission state, and feedback messages. Calls the submission API and notifies its parent when a request is created. |
| `RequestList.tsx` | Displays request summaries, filters them by status, and tracks which request is selected. Opens `RequestDetails` when the user selects **View details**. |
| `RequestDetails.tsx` | Fetches and displays a request's full content, status, and timestamps. For administrators, also displays customer information and controls for saving a new status. Notifies the parent when a request is updated. |
| `api.ts` | Provides typed functions for listing requests, fetching one request, submitting a request, and updating its status. Uses the existing `apiRequest` helper for HTTP communication. |
| `requests.css` | Defines feature-specific styles, including status badges, request details, filters, and form presentation. |

## How the components work together

```text
Customer dashboard / Admin Requests tab
└── RequestsPanel
    └── RequestList
        └── RequestDetails

New request page (/requests/new)
└── NewRequestPage
    └── RequestForm

Components → api.ts → Backend → Database
```

The customer dashboard displays request history without an open submission form. The **Submit a new request** button opens a separate page. After submission, the customer can return to the dashboard to track progress.

The admin Requests tab renders `RequestsPanel` with `isAdmin` enabled. Administrators can review details and change a request's status. After a successful update, the saved record is passed back to the panel so the list reflects the change.

**Refresh requests** reloads the history from the backend. Updates made in another browser or session are not pushed to an already-open page automatically.

## Related modules

- `shared/requests.ts` at the project root defines request types, allowed statuses, and display labels used by both frontend and backend.
- `src/auth.ts` provides the shared HTTP helper and account/session functions.
- `src/components/AccountPage.tsx` provides the customer page layout and account access checks.
- `src/components/AccountOverview.tsx` contains the dashboard links to profile editing and request submission.
- `src/components/Admin.tsx` provides the administrator page and Requests tab.
- `server/requests/` contains request routes, validation, database schemas, and SQLite/PostgreSQL repository implementations.

## Access and status rules

Customers must sign in to submit requests and can only read their own records. Administrators can read all requests and update their status. New requests start as **Pending**; the other statuses are **In progress**, **Completed**, and **Cancelled**.

The frontend shows controls appropriate to the current view, but the backend enforces authentication, ownership, and administrator permissions. Hiding a button is not an access-control check.

## Where to make changes

- To change form fields or placeholder text, edit `RequestForm.tsx`. Changes to stored fields also require updates to shared types and backend validation/schema.
- To change list filtering or summaries, edit `RequestList.tsx`.
- To change the details view or status controls, edit `RequestDetails.tsx`.
- To change the submission confirmation, edit `NewRequestPage.tsx`.
- To change HTTP endpoints, edit `api.ts` and the corresponding backend routes.
- To change feature styling, edit `requests.css`.
