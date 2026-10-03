# File & Document Management

| File | Responsibility |
| --- | --- |
| `DocumentsPage.tsx` | Displays the file picker, upload feedback, metadata list, refresh and delete controls. Supports embedding inside My Space and a standalone page; waits for saved metadata after upload. |
| `api.ts` | Defines `DocumentRecord`, validates file selection/type/size, calls list/delete APIs, and selects local multipart or private Vercel Blob direct upload. |
| `documents.css` | Provides document layout, filename wrapping, list/button styles, and responsive rows. |

`src/components/AccountPage.tsx` embeds the page under **My Documents**, alongside the existing **My Requests** tab. My Space retains its heading and outer layout. `src/App.tsx` also maps `/documents` to the standalone page. Existing account helpers supply the session; the backend independently enforces ownership.

PDF, DOC, DOCX, and TXT files are supported up to 10 MB (10 MiB). The UI reports missing/empty files, unsupported formats, oversized files, loading, success, and API errors. Records display the original filename, type, size, and upload date. Successful deletion removes the row; refreshing reloads saved records from the backend.

Development defaults to local multipart upload; production builds default to Blob direct upload. `VITE_DOCUMENT_UPLOAD_MODE` can explicitly select `local` or `blob`. Local requests use `src/lib/http.ts`, which preserves session credentials and lets the browser set the multipart boundary. The Blob SDK requests a scoped token from the same upload endpoint with `X-Nuvra-Request: 1`; it sends no permanent storage credential or trusted `user_id` field. The session user's ID forms the required pathname, which the backend verifies.

After transfer, the page polls the document list for completion metadata. If verification is still pending, it asks the user to refresh rather than reporting success prematurely. Storage implementation and endpoint rules are documented in the [backend README](../../../server/README.md#task-10--file--document-management).
