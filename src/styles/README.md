# Shared styles

- `site.css`: base colours, typography, shared controls, landing-page sections, navigation, footer, and responsive rules.
- `admin.css`: management navigation, forms, record lists, and tables. Some shared controls are also used in customer request history.
- `account.css`: login, registration, dashboard, profile forms, and account navigation.

`src/index.css` imports these files in the above order. Keep this order when editing to preserve the cascade. Feature-specific request styles remain in `src/features/requests/requests.css`.

Staff workspace themes live in [../features/account/workspace.css](../features/account/workspace.css), imported by `WorkspaceIdentity.tsx`. That module owns the Admin charcoal/mint and Employee navy/blue backgrounds, role badges, dark controls/cards, and responsive identity header. Its rules are scoped to `.staff-workspace`; the employee modifier is `.staff-workspace--employee`. See the [Account module](../features/account/README.md) for the related component files.
