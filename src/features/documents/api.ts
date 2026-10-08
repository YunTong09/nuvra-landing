import { upload } from "@vercel/blob/client";
import { API_URL, apiRequest } from "../../lib/http";

export type DocumentRecord = {
  id: number; user_id: number; original_name: string; stored_name: string;
  mime_type: string; file_size: number; created_at: string;
};
const types: Record<string, string> = {
  pdf: "application/pdf", doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", txt: "text/plain",
};
export function validateFile(file: File | null): string {
  if (!file) return "Choose a file first.";
  const mime = types[file.name.split(".").pop()?.toLowerCase() || ""];
  if (!mime || (file.type && file.type !== mime)) return "Choose a PDF, DOC, DOCX, or TXT file.";
  if (!file.size) return "The file must not be empty.";
  if (file.size > 10 * 1024 * 1024) return "File exceeds the 10 MB limit.";
  return "";
}
export const listDocuments = () => apiRequest<DocumentRecord[]>("documents");
export const deleteDocument = (id: number) => apiRequest<null>(`documents/${id}`, "DELETE");

export async function uploadDocument(file: File, sessionUserId: number): Promise<string> {
  const error = validateFile(file);
  if (error) throw new Error(error);
  const extension = file.name.split(".").pop()!.toLowerCase();
  const mime = types[extension];
  // Vite resolves the backend-specific mode for both development and built previews.
  const mode = import.meta.env.VITE_DOCUMENT_UPLOAD_MODE;
  if (mode === "local") {
    const body = new FormData();
    body.append("file", new File([file], file.name, { type: mime }));
    const document = await apiRequest<DocumentRecord>("documents", "POST", body);
    return document.stored_name;
  }
  if (mode !== "blob") throw new Error("Document upload mode is not configured correctly.");
  const blob = await upload(`documents/${sessionUserId}/${crypto.randomUUID()}.${extension}`, file, {
    access: "private", contentType: mime,
    handleUploadUrl: `${API_URL}/api/documents`,
    headers: { "X-Nuvra-Request": "1" },
    clientPayload: JSON.stringify({ original_name: file.name, mime_type: mime, file_size: file.size }),
  });
  return blob.url;
}
