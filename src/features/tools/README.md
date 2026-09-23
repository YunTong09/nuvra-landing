# Tools Management

`ToolsAdmin.tsx` manages the administrator Tools view: loading the service list, adding and editing tools, deleting tools, and displaying feedback. It was extracted from `src/components/Admin.tsx` without changing its behaviour.

`Admin.tsx` handles administrator access, logout, navigation, and selecting which management feature to display. It imports `ToolsAdmin` for the Tools tab.

`api.ts` provides tool read/save/delete calls through `src/lib/http.ts`. `types.ts` defines the `Tool` record. Backend permissions continue to protect all tool mutations. The public tools display remains in `src/components/Services.tsx`.
