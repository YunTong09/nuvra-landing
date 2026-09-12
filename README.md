# Nuvra — My project review guide

This project lives in the `Voltix` folder. It uses React and TypeScript for the website, Express running on Node.js for the backend, and SQLite for stored data.

## 1. What each task adds

| Task | What I built | Main files to review |
| --- | --- | --- |
| Task 1 | A responsive company landing page | `src/App.tsx`, landing page components, `src/index.css` |
| Task 2 | A form connected to an API and database | `CTA.tsx`, `server/app.ts`, `server/index.ts` |
| Task 3 | Admin CRUD for tools, extended with clients and subscriptions | `Admin.tsx`, `ClientsAdmin.tsx`, `SubscriptionsAdmin.tsx`, `server/tools.ts`, `server/relationships.ts` |

CRUD means **Create, Read, Update, Delete**. The feedback form still sends the original inquiry fields, even though its visible wording now asks about everyday organisation.

## 2. The three parts of the application

| Part | Where it runs | Its job |
| --- | --- | --- |
| Frontend | In the visitor's browser | Display pages, collect input, send requests, show results |
| Backend | In a Node.js process, outside the browser | Receive API requests, validate data, read/write the database |
| Database | SQLite file opened by the backend | Keep records after the page closes or the server restarts |

```text
Browser / React
    │ HTTP request using fetch()
    ▼
Backend / Express
    │ Validate input, then run SQL
    ▼
SQLite database
    │ Return records or confirm a change
    ▼
Backend sends an HTTP response
    │
    ▼
React updates what the user sees
```

The frontend does not open the database file directly.

## 3. Project structure

```text
Voltix/
├── src/                         Frontend source code
│   ├── main.tsx                 Starts React
│   ├── App.tsx                  Chooses landing page or admin page
│   ├── api.ts                   API address, record types, request helpers
│   ├── index.css                Website and admin styles
│   ├── assets/                  Assets imported by frontend code, if present
│   ├── data/
│   │   └── companyData.ts       Shared landing page content
│   └── components/
│       ├── Navbar.tsx
│       ├── Hero.tsx
│       ├── About.tsx
│       ├── Services.tsx
│       ├── Benefits.tsx
│       ├── Stats.tsx
│       ├── CTA.tsx
│       ├── Footer.tsx
│       ├── Icon.tsx
│       ├── Admin.tsx
│       ├── ClientsAdmin.tsx
│       └── SubscriptionsAdmin.tsx
├── server/                      Backend source code
│   ├── index.ts                 Opens database and starts server
│   ├── app.ts                   Builds Express app and feedback endpoint
│   ├── tools.ts                 Tool table and CRUD endpoints
│   ├── relationships.ts         Client/subscription tables and CRUD endpoints
│   └── voltix.db                Local SQLite data; created at runtime
├── tests/
│   ├── tools.test.ts
│   └── relationships.test.ts
├── public/                      Static files such as favicon.svg
├── index.html                   HTML entry page
├── package.json                 Dependencies and npm commands
├── package-lock.json            Exact dependency versions
├── vite.config.ts               Frontend development/build settings and API proxy
├── tsconfig.json                Links the TypeScript configurations
├── tsconfig.app.json            TypeScript settings for src/
├── tsconfig.node.json           TypeScript settings for backend and Vite config
├── vercel.json                  Frontend hosting rewrite for /admin
├── .gitignore                   Files Git should ignore
├── .oxlintrc.json                Linter settings
├── .openai/hosting.json          Hosting configuration from the earlier Sites setup
├── node_modules/                Installed dependencies; generated
└── dist/                        Built frontend; generated
```

`.ts` is a TypeScript file. `.tsx` is TypeScript that can also contain JSX, the HTML-like markup used by React.

## 4. Frontend files: what each one does

| File | Purpose |
| --- | --- |
| `src/main.tsx` | Mounts React into the HTML page and loads the main styles. |
| `src/App.tsx` | Checks the URL. `/admin` displays `Admin`; other paths display the landing page sections. |
| `src/index.css` | Controls colours, gradients, spacing, responsive layouts, forms, and admin tables. |
| `src/data/companyData.ts` | Holds shared content used by landing page components. Tool records now come from the API instead. |
| `Navbar.tsx` | Displays the top navigation. |
| `Hero.tsx` | Displays the opening headline and introduction. |
| `About.tsx` | Explains the company direction. |
| `Services.tsx` | Loads tools from the backend and renders their cards, including loading/error/empty states. |
| `Benefits.tsx` | Displays the benefits section. |
| `Stats.tsx` | Renders the section defined by this component; review its JSX when changing that landing page content. |
| `CTA.tsx` | Displays the feedback form, reads entered values, submits them, and shows success or error messages. CTA means “call to action.” |
| `Footer.tsx` | Displays the bottom section and links. |
| `Icon.tsx` | Provides reusable icons. |
| `Admin.tsx` | Displays admin navigation, chooses the active table, and contains the tools management component (`ToolsAdmin`). |
| `ClientsAdmin.tsx` | Displays the client list and forms for adding/editing clients; handles deletion. |
| `SubscriptionsAdmin.tsx` | Loads clients, tools, and subscriptions; lets the admin link records and change subscription status. |
| `src/api.ts` | Defines `API_URL`, `Tool`, `Client`, and `Subscription`, plus `loadTools()` and `adminRequest()`. |

### Why separate the admin components?

Each component manages a different form and list. Clients need a name and email; subscriptions need client/tool selections and a status. Keeping them separate makes the code easier to read. They are sections of one admin page, not different accounts or databases.

### Types and helper functions

- `Tool`, `Client`, and `Subscription` describe the fields and TypeScript types expected for each record. They do not create database tables or validate incoming HTTP data at runtime.
- `loadTools()` requests tool records from the backend.
- `adminRequest()` handles shared requests for the client and subscription admin views.
- `API_URL` controls where requests go: locally through the Vite proxy, or to the configured hosted backend.

## 5. Backend files: why the server folder exists

`server/` groups the code that runs outside the browser. The folder name is an organisational choice; creating the folder alone does not start a server.

| File | What happens here | Why separate it? |
| --- | --- | --- |
| `server/index.ts` | Opens `server/voltix.db` (or `DATABASE_PATH`), calls `createApp(database)`, and listens on `PORT` or 3001. | Keeps starting the server separate from defining its behaviour. |
| `server/app.ts` | Creates Express, enables foreign keys, configures CORS and JSON parsing, creates inquiries, handles `/api/contact`, registers the other routes, and handles errors. | Provides one place to connect the API pieces. Tests can create an app with a separate test database. |
| `server/tools.ts` | Creates the tools table, seeds starter tools when first created, validates tool input, and defines tool CRUD routes. | Keeps tool-specific SQL and routes together. |
| `server/relationships.ts` | Creates clients/subscriptions, validates their input, and defines their CRUD routes and joined reads. | Keeps related client and subscription logic together. |

`express.json()` turns incoming JSON into `req.body`. CORS headers allow browser requests across origins. SQL parameter binding passes values separately from SQL commands.

## 6. Database structure

All four tables live in the same SQLite database file.

| Table | Fields | Purpose |
| --- | --- | --- |
| `inquiries` | `id`, `name`, `email`, `subject`, `message`, `created_at` | Feedback submitted through the public form |
| `tools` | `id`, `title`, `description`, `created_at`, `updated_at` | Tools displayed on the landing page |
| `clients` | `id`, `name`, `email`, `created_at`, `updated_at` | Client details |
| `subscriptions` | `id`, `client_id`, `tool_id`, `status`, `created_at`, `updated_at` | Which tools each client subscribes to |

### Primary keys and foreign keys

A **primary key** identifies a row in its own table. A **foreign key** points to a row in another table.

```text
clients                         subscriptions                    tools
id = 1  Irene  ◄───────────────  client_id = 1
                                tool_id = 2  ─────────────────►  id = 2  Daily Priorities
                                status = active
```

This subscription means “Irene subscribes to Daily Priorities.” Names are read using a SQL join; they do not need to be copied into the subscription row.

One client can have several subscriptions, and one tool can have several clients. Each client/tool pair can appear only once.

### Rules to remember

- Client email addresses are unique without case sensitivity.
- Subscription status is `active` or `cancelled`.
- A subscription must reference an existing client and tool.
- A client or tool cannot be deleted while subscriptions reference it, including cancelled subscriptions.
- Cancelling preserves the subscription record. Deleting removes it.
- `created_at` records creation time; `updated_at` changes when the record is edited. Admin timestamps are displayed in UTC.
- Feedback does **not** automatically create a client or subscription.
- Tables are created by backend startup code. The TypeScript frontend types do not create them.

The default file is `server/voltix.db`. Local and hosted databases are separate. `DATABASE_PATH` can point to a file in an existing persistent directory on the host.

## 7. Follow the code flows

### Starting the application

```text
npm run server
→ server/index.ts opens SQLite
→ createApp(database) in server/app.ts
→ registerTools() and registerRelationships() set up tables/routes
→ app.listen() waits for requests

npm run dev
→ Vite serves the frontend
→ index.html loads src/main.tsx
→ React renders App.tsx
→ App chooses the landing page or admin page
```

### Submitting feedback (Task 2)

1. The visitor fills in `CTA.tsx` and clicks **Share feedback**.
2. `onSubmit={handleSubmit}` calls the function when submission happens.
3. `event.preventDefault()` stops the browser's normal form navigation.
4. `new FormData(event.currentTarget)` reads the submitted form's fields.
5. The selected difficulty becomes `subject`; the textarea becomes `message`.
6. `fetch()` sends JSON to `POST /api/contact`.
7. `server/app.ts` checks that all four fields are non-empty strings and the email has a valid format.
8. Valid data is inserted into `inquiries`; the API returns status 201.
9. React shows a success message and resets the form. Errors are shown instead when submission fails.

### Adding a tool (Task 3)

1. Open `/admin` and click **Add Tool**.
2. `ToolsAdmin` in `Admin.tsx` shows the form.
3. Saving sends the title and description to `POST /api/tools`.
4. `server/tools.ts` validates the fields and inserts the record.
5. The response contains the saved tool, including its generated ID.
6. The admin list updates. Refresh the landing page to see the new card loaded by `Services.tsx`.

Editing uses `PUT /api/tools/:id`; deletion uses `DELETE /api/tools/:id` after confirmation.

### Creating a subscription

1. Create a client and a tool first.
2. Open the Subscriptions tab.
3. `SubscriptionsAdmin.tsx` loads all three lists so it can show readable choices.
4. Select a client, tool, and status.
5. The frontend sends numeric `client_id` and `tool_id` values to the API.
6. `server/relationships.ts` validates the input; database constraints enforce the relationships and uniqueness.
7. The saved subscription appears with the client's name and tool title.

## 8. API reference

An endpoint is a combination of an HTTP method and a URL path handled by the backend. `:id` means an actual record ID, such as `/api/tools/2`.

| Method | Path | Action |
| --- | --- | --- |
| POST | `/api/contact` | Save feedback |
| GET | `/api/tools` | List tools |
| POST | `/api/tools` | Create tool |
| PUT | `/api/tools/:id` | Update tool |
| DELETE | `/api/tools/:id` | Delete tool |
| GET | `/api/clients` | List clients |
| POST | `/api/clients` | Create client |
| PUT | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Delete client |
| GET | `/api/subscriptions` | List subscriptions with client/tool details |
| POST | `/api/subscriptions` | Create subscription |
| PUT | `/api/subscriptions/:id` | Update subscription |
| DELETE | `/api/subscriptions/:id` | Delete subscription |

Common responses: **200** success, **201** created, **204** deleted with no response body, **400** invalid input, **404** missing route/record, **409** duplicate or relationship conflict, **500** server error.

## 9. React terms I can review

| Term | Meaning in this project |
| --- | --- |
| `useState` | Remembers values such as a list, an error, or whether a form is open; updating state causes React to render again. |
| `useEffect` | Runs work after rendering, such as initially loading records from the API. |
| `useRef` | Keeps a reference to an input or button so code can do something like focus it. |
| `FormEvent<HTMLFormElement>` | TypeScript describes the event as coming from an HTML form. |
| `event.currentTarget` | The element whose event handler is running; here, the form. |
| `id` / `htmlFor` | Matching values connect a label to an input so clicking the label focuses it. |
| `name` | The field key used by `FormData`, such as `fields.get("email")`. |
| `onSubmit={handleSubmit}` | Gives React the function to call later when the form is submitted. |
| `handleSubmit(...)` | Calls the function immediately with the supplied arguments. |
| `async` / `await` | Lets a function wait for a request/result without blocking the whole page. |
| `JSON.stringify()` | Converts an object into JSON text to send in a request. |
| `response.json()` | Reads and parses a response body as JSON; it fails if the body is empty or not valid JSON. |
| `try` / `catch` | Runs an operation and handles errors if it fails. |

## 10. Generated files and configuration

| Item | What to remember |
| --- | --- |
| `dist/` | Generated by `npm run build`. Edit `src/`, then rebuild; direct changes in `dist/` can be overwritten. |
| `dist/assets/` | Built JavaScript/CSS and other processed assets, often with generated names. |
| `src/assets/` | Source images and other assets imported by components, if used. |
| `public/` | Static files copied to the build without the same import processing, such as the favicon. |
| `node_modules/` | Packages installed by npm. Do not edit them for application changes. |
| `package.json` | Lists packages and scripts such as `dev`, `server`, `build`, and `test`. |
| `package-lock.json` | Generated by npm to record exact dependency versions; keep it in Git. |
| `tsconfig.app.json` | Checks frontend TypeScript and JSX, including browser types. |
| `tsconfig.node.json` | Checks `server/**/*.ts` and `vite.config.ts` using Node.js types. |
| `tsconfig.json` | Connects the two TypeScript configurations for the build check. |
| `vite.config.ts` | Makes local `/api` requests go to `http://127.0.0.1:3001`. |
| `vercel.json` | Lets Vercel serve the frontend when `/admin` is opened directly. |
| `.gitignore` | Excludes generated files and the local database from Git. |
| `.openai/hosting.json` | Configuration from the earlier Sites hosting setup; not where the form records are stored. |

## 11. Running and checking the project

Install dependencies after cloning or when dependencies change:

```bash
npm install
```

Terminal 1 — frontend:

```bash
npm run dev
```

Terminal 2 — backend:

```bash
npm run server
```

Leave both running. The current backend command does not automatically restart after source edits: press **Control + C** in its terminal, then run `npm run server` again.

| Page | Local address |
| --- | --- |
| Landing page | `http://localhost:5173/` |
| Tools admin | `http://localhost:5173/admin` |
| Clients admin | `http://localhost:5173/admin?table=clients` |
| Subscriptions admin | `http://localhost:5173/admin?table=subscriptions` |
| Backend status | `http://localhost:3001/` |

Use the frontend port printed by Vite if it chooses a different one.

```bash
npm test
npm run lint
npm run build
npm run preview
```

- `tests/tools.test.ts` checks tool CRUD, validation, persistence, and feedback submission using a temporary database.
- `tests/relationships.test.ts` checks clients, subscriptions, uniqueness, and foreign-key restrictions using a separate test database.
- Tests do not delete the real application records.
- `lint` checks code issues; `build` checks TypeScript and generates `dist/`; `preview` serves that frontend build locally and still needs the backend for API requests.

For a manual check: submit feedback, add/edit a tool, refresh the landing page, add a client, create a subscription, change its status, and check that deleting a linked client/tool is blocked. Restart the backend and verify saved records remain.

## 12. Troubleshooting and hosting reminders

| Symptom | What to check |
| --- | --- |
| `npm dev` is unknown | Use `npm run dev`. |
| Cannot find `server/index.ts` | Check that the file exists and the terminal is in the project folder. |
| Connection refused | Check that the relevant frontend/backend process is running. |
| API returns 404 after adding routes | Restart the backend and check the route and Vite proxy. |
| Unexpected end of JSON input | Inspect the request in the browser Network panel: the response body may be empty or not JSON. |
| Add Subscription is disabled | Clients and tools must load successfully, and at least one of each must exist. |
| Changes do not appear online | Local file changes do not deploy the hosted frontend/backend. |

The configured hosting setup is **Vercel for the frontend** and **Render for the backend**. `src/api.ts` defaults production requests to `https://nuvra-landing.onrender.com`; `VITE_API_URL` can override this at build time. Render supplies `PORT`. SQLite on a host needs persistent storage to retain data when the service filesystem is replaced.

The admin page currently has **no authentication**. Opening `/admin` is navigation, not a login check, and its API is also unprotected.

## 13. Where to start when reviewing

Read `App.tsx` first to see the pages, then follow one feature end to end:

```text
Feedback:      CTA.tsx → server/app.ts → inquiries
Tools:         Admin.tsx → server/tools.ts → tools → Services.tsx
Clients:       ClientsAdmin.tsx → src/api.ts → server/relationships.ts → clients
Subscriptions: SubscriptionsAdmin.tsx → src/api.ts → server/relationships.ts → subscriptions
```

When changing wording, start with the component. When changing validation or saved fields, review the frontend form, API request, backend validation, SQL, and record types together.
