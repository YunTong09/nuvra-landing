# Shared modules

These modules contain definitions used across frontend and backend. They do not access the database or render UI.

| File | Responsibility |
| --- | --- |
| [roles.ts](roles.ts) | Defines `UserRole` (`user`, `employee`, `admin`) and `canManageRequests`, which permits employees and administrators to manage customer requests. |
| [requests.ts](requests.ts) | Defines request records, submission inputs, search/filter types, allowed statuses, and display labels. |

The authentication modules retrieve roles from database-backed sessions. `server/requests/routes.ts` uses `canManageRequests` to allow all-request reads and status updates; customer reads are limited to the session owner's records. The frontend account helper uses `UserRole` for typing. The similarly named `RequestsPanel` prop only controls which UI is shown; backend checks still enforce access.
