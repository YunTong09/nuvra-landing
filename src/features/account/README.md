# Account helpers

`auth.ts` defines the current-user type, looks up the signed-in account, and chooses the customer, employee, or administrator workspace URL. It uses `src/lib/http.ts` for network requests. Account page and form components currently remain in `src/components/`.

These browser helpers do not verify passwords or grant permissions. The backend authentication modules perform those checks.

`WorkspaceIdentity.tsx` displays the signed-in staff role, name, and email. `workspace.css` scopes shared dark workspace styles to staff pages: charcoal/mint for administrators and navy/blue for employees, including the employee profile editor.
