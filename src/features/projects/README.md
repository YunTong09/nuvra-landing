# Client Project Management

| File | Responsibility |
| --- | --- |
| `ProjectsWorkspace.tsx` | Embeds Overview and Manage projects/My projects inside the existing Admin/Employee workspace and imports feature styles. |
| `ProjectsPage.tsx` | Redirects old `/projects` links to the appropriate authenticated workspace, preserving overview/management intent. |
| `ProjectsPanel.tsx` | Coordinates project loading, create/edit form selection, mutation feedback, and the records list. |
| `ProjectForm.tsx` | Shared Admin create/edit form for name, description, client, status, and multiple members. Loads existing client and employee options and preserves existing assignments when a member's role changes. |
| `ProjectList.tsx` | Displays project description, client, status, members, and update time. Admin receives edit/delete actions; employees receive status-only updates. |
| `ProjectDashboard.tsx` | Loads dashboard statistics and accessible project summaries, with loading, error/retry, and empty states. Contains no CRUD controls. |
| `useProjects.ts` | Loads records, handles mutation/loading/error/success state, confirms deletion, and updates the list after successful writes. |
| `api.ts` | Typed project CRUD, status-only PATCH, dashboard, and Admin employee-option calls through the shared HTTP helper. |
| `types.ts` | Project records, input/member/employee-option types, dashboard response, and canonical project status values. |
| `projects.css` | Project cards, member selectors, status forms, and responsive statistics layout. |

Admin opens **Projects** at `/admin?table=projects`; Employee opens it at `/employee?section=projects`. Overview is the default, and `&view=projects` opens Manage projects or My projects. Existing workspace headers and authentication remain in their owning pages.

Overview displays the backend's total, In Progress, Completed, Not Started, and On Hold counts and project list. Management uses `GET /api/projects`, `POST /api/projects`, `PATCH /api/projects/:id`, and `DELETE /api/projects/:id`; the dashboard uses `GET /api/projects/dashboard`. The backend also exposes project details at `GET /api/projects/:id`. Admin form choices use existing `GET /api/clients` and Admin-only `GET /api/users/options` data.

Admin can create/edit/delete projects, choose a client, assign/remove members, and update status. Team Members can view assigned projects and send only a status update. Status values are `Not Started`, `In Progress`, `Completed`, and `On Hold`; new forms default to `Not Started`. API validation errors are shown without discarding the open form. Changes made in another session appear on the next load; there is no live push subscription.

The frontend uses the existing `admin` and `employee` roles for presentation. Session identity, project visibility, and permitted writes are enforced independently by the backend. Shared backend routes/types live in `server/features/projects/routes.ts`; SQLite and PostgreSQL repositories remain in their database-specific folders. See the [backend README](../../../server/README.md#task-11--client-project-management-platform) for API and database rules.
