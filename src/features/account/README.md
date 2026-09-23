# Account helpers

`auth.ts` defines the current-user type, looks up the signed-in account, and chooses the customer or administrator dashboard URL. It uses `src/lib/http.ts` for network requests. Account page and form components currently remain in `src/components/`.

These browser helpers do not verify passwords or grant permissions. The backend authentication modules perform those checks.
