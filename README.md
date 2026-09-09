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
