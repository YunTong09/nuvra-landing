# Shared styles

- `site.css`: base colours, typography, shared controls, landing-page sections, navigation, footer, and responsive rules.
- `admin.css`: management navigation, forms, record lists, and tables. Some shared controls are also used in customer request history.
- `account.css`: login, registration, dashboard, profile forms, and account navigation.

`src/index.css` imports these files in the above order. Keep this order when editing to preserve the cascade. Feature-specific request styles remain in `src/features/requests/requests.css`.
