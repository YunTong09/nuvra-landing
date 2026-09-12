# Voltix Internship Project

Responsive landing page for **nuvra.**, built with React, TypeScript, Vite, Express, and SQLite.

## Task 2 - Contact and Inquiry System

Visitors can submit an inquiry with Name, Email, Subject, and Message. The frontend sends the data to Express, the backend validates it, and valid inquiries are stored in SQLite.

## Getting started

Use Node.js 22.12+ or a supported newer LTS version.

```bash
npm install
npm run dev
```

Start the backend in a second terminal:

```bash
npm run server
```

The frontend runs at `http://localhost:5173` and the backend runs at `http://localhost:3001`.

## Contact API

The endpoint is:

```text
POST /api/contact
```

Example request:

```bash
curl -i -X POST http://localhost:3001/api/contact \
	-H "Content-Type: application/json" \
	-d '{"name":"Test User","email":"test@example.com","subject":"Test","message":"Hello"}'
```

Valid requests return HTTP `201`. Empty fields or invalid email addresses return HTTP `400` with an error message.

## Database

Valid inquiries are stored in `server/voltix.db` in the `inquiries` table. The table stores the name, email, subject, message, and creation time.

To inspect the local database:

```bash
node --input-type=module -e '
import Database from "better-sqlite3";
const db = new Database("server/voltix.db");
console.table(db.prepare("SELECT * FROM inquiries ORDER BY id DESC").all());
'
```

## Checks and production build

```bash
npm run lint
npm run build
npm run preview
```

`build` checks TypeScript and creates the production frontend files in `dist`.

## Deployment

- Frontend: Vercel
- Backend: Render
- Backend URL: `https://nuvra-landing.onrender.com`
- API URL: `https://nuvra-landing.onrender.com/api/contact`

The Render service uses the `PORT` environment variable supplied by Render. SQLite is suitable for demonstrating this assignment; a hosted PostgreSQL database would be more appropriate for permanent production storage.

## Project structure

```text
src/
	App.tsx
	components/
		CTA.tsx
	index.css
server/
	index.ts
package.json
vite.config.ts
```

## Task 3 — Tool content management

Run `npm run server` in one terminal and `npm run dev` in another. Restart an already-running backend after changing its code.

- Website: `http://localhost:5173/`
- Admin: `http://localhost:5173/admin`

Use the port Vite prints if 5173 is already occupied. The admin page is reached directly by its URL; it is not added to the public navigation.

### Frontend

`src/components/Admin.tsx` displays all tools and a simple Add/Edit form. Delete asks for confirmation. Loading, empty, success, and error states are included. `src/App.tsx` chooses the admin page for `/admin`; no routing library is needed.

`src/components/Services.tsx` now requests tools from the API instead of using hard-coded cards. `src/api.ts` holds the shared API address and `Tool` type. The existing feedback form uses that same API address and still submits `name`, `email`, `subject`, and `message`.

Local development proxies `/api` to port 3001. Production uses the existing Render backend by default. Set `VITE_API_URL` before building if the backend address changes. The Vercel rewrite in `vercel.json` makes opening `/admin` directly work after deployment.

### Backend and database

`server/index.ts` opens SQLite and starts Express. `server/app.ts` contains the existing feedback route and application setup. `server/tools.ts` creates the tools table and registers:

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/tools` | Read all tools |
| POST | `/api/tools` | Add a tool |
| PUT | `/api/tools/:id` | Edit a tool |
| DELETE | `/api/tools/:id` | Delete a tool |

POST and PUT take `{ "title": "Task Simplifier", "description": "Break a task into steps." }`. Both fields are required strings; limits are 100 and 1000 characters. Invalid input returns 400, missing records return 404, and database errors return 500. SQL uses parameter binding.

The `tools` table stores `id`, `title`, `description`, `created_at`, and `updated_at`. Four starter tools are inserted only when this table is first created. Deleting all tools leaves it empty, even after restarting. Existing inquiries are preserved.

The default database is `server/voltix.db`. Set `DATABASE_PATH` to a database file in an existing persistent directory when hosting. Render needs persistent storage for SQLite to survive replacement of its service filesystem; local and hosted databases are separate.

### CRUD flow

Admin action → API request → validation → SQLite → response → updated admin list.

Landing page → GET `/api/tools` → SQLite → tool cards. Refresh the landing page after an admin change to see the new content.

### How to test

1. Start both servers and open `/admin`.
2. Add a tool, then refresh the website to see its card.
3. Edit its title and description, then refresh the website again.
4. Cancel a deletion to check nothing changes, then confirm deletion.
5. Restart the backend and verify your changes are retained.
6. Submit feedback to verify the existing contact system still works.
7. Run `npm test`, `npm run build`, and `npm run lint`.

The automated test uses an isolated temporary database and checks all four endpoints, validation, persistence, deletion, and the feedback endpoint.

**Access:** As requested, no authentication was added. `/admin` is an interface, not an access-control boundary: anyone who can reach the API can modify tools. Keep this assignment private or add access control before exposing administrative writes publicly.

Deploy the updated backend and frontend together. The new routes will not be available on Render until that backend deployment is updated. These source changes alone do not publish either service.

## Clients and subscriptions

Admin navigation now separates three record types:

- `/admin` — Tools: manage the offerings shown on the landing page.
- `/admin?table=clients` — Clients: add, edit, view, or delete clients.
- `/admin?table=subscriptions` — Subscriptions: assign a tool to a client, edit the assignment/status, or delete it.

All three views show record IDs and created/updated timestamps in UTC. Add a client and a tool first, then select them by name in the subscription form. The API stores their numeric IDs.

| Table | Columns |
| --- | --- |
| clients | id, name, email, created_at, updated_at |
| tools | id, title, description, created_at, updated_at |
| subscriptions | id, client_id, tool_id, status, created_at, updated_at |

`subscriptions.client_id` references `clients.id`; `subscriptions.tool_id` references `tools.id`. Each client/tool pair can appear only once. Email is unique without case sensitivity. Status is `active` or `cancelled`. Edit a cancelled subscription to reactivate it rather than creating a duplicate.

SQLite foreign keys are enabled on startup. Deleting a client or tool with subscriptions is blocked, including cancelled subscriptions. Cancel a subscription to keep its record; explicitly delete it only when you want to remove that relationship. Once no subscriptions reference a client/tool, it can be deleted. There are no cascading deletes.

`server/relationships.ts` adds these tables without clearing existing tools or inquiries. It provides GET/POST `/api/clients` and `/api/subscriptions`, plus PUT/DELETE `/api/clients/:id` and `/api/subscriptions/:id`. Subscription reads join the tables to return readable client names, emails, and tool titles alongside the stored IDs. Duplicate records and foreign-key conflicts return HTTP 409 with a message.

`ClientsAdmin.tsx` and `SubscriptionsAdmin.tsx` handle their own forms and lists. `Admin.tsx` selects the view using the URL query parameter. No router library or authentication was added. Client data is accessible through the API: this is a private assignment setup, not a secured customer system.

Test by adding a client, assigning two tools, changing status to cancelled and back to active, and trying to delete a linked client/tool. Confirm duplicates are rejected. Restart the backend to verify records remain. `npm test` checks these relationships using isolated test databases; it never deletes your actual records.
