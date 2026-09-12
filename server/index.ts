import Database from "better-sqlite3";
import { createApp } from "./app.ts";

const database = new Database(process.env.DATABASE_PATH || "server/voltix.db");
const app = createApp(database);
const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
