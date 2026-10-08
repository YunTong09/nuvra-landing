import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  // Match the existing backend: SQLite uses local files; PostgreSQL uses Blob.
  // Explicit configuration also supports a frontend built for a remote backend.
  // This value is baked into builds, so changing the target requires a rebuild.
  const uploadMode = process.env.VITE_DOCUMENT_UPLOAD_MODE ?? env.VITE_DOCUMENT_UPLOAD_MODE ??
    (process.env.VERCEL || process.env.DATABASE_URL ? "blob" : "local");
  if (uploadMode !== "local" && uploadMode !== "blob") {
    throw new Error("VITE_DOCUMENT_UPLOAD_MODE must be local or blob.");
  }
  return {
    plugins: [react()],
    define: { "import.meta.env.VITE_DOCUMENT_UPLOAD_MODE": JSON.stringify(uploadMode) },
    server: { proxy: { "/api": "http://127.0.0.1:3001" } },
    preview: { proxy: { "/api": "http://127.0.0.1:3001" } },
  };
});
