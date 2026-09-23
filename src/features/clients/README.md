# Clients Management

| File | Responsibility |
| --- | --- |
| `ClientsAdmin.tsx` | Loads records, manages editing and loading state, handles save/delete actions, and combines the form and list. |
| `ClientForm.tsx` | Displays the add/edit fields, focuses the first field on opening, and passes submit/cancel events to the parent. |
| `ClientList.tsx` | Displays the records table and passes edit/delete actions to the parent. |
| `api.ts` | Provides typed backend calls through `src/lib/http.ts`. |
| `types.ts` | Defines the feature's record type. |

The parent owns mutation state and feedback. The form is keyed by record ID so switching records resets its fields. Existing shared admin styles remain in `src/styles/admin.css`; the backend enforces administrator permissions and database relationships.
