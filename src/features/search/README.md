# Shared admin search

`SearchBar.tsx` displays a keyword field and Search/Clear search buttons. It holds the draft text and sends the submitted query to its parent through `onSearch`.

Tools, Clients, and Subscriptions use this component. Each management container keeps the applied query, loads results through its feature API, and ignores outdated requests when a new query starts. Refresh and successful saves reuse the applied query. The server performs all record matching.

Requests uses its own `RequestSearch.tsx` because it also provides status and date filters. The customer dashboard continues to use that request search.
