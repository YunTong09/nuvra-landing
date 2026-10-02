import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { get, del } from "@vercel/blob";
import { handleUpload } from "@vercel/blob/client";
import type { Express, Request } from "express";
import type { DocumentRepository, DocumentMetadata } from "./documents.js";

export type StoredDocument = {
  storedName: string;
  // Compensate for a failed metadata insert; this is not a document-delete API.
  rollback(): Promise<void>;
};

export type DocumentStorage = {
  kind: "local";
  remove(document: DocumentMetadata): Promise<void>;
  save(userId: number, file: Express.Multer.File): Promise<StoredDocument>;
} | {
  kind: "blob";
  remove(document: DocumentMetadata): Promise<void>;
  authorize(req: Request, userId: number): Promise<unknown>;
};

export class DocumentUploadError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export const maxFileSize = 10 * 1024 * 1024;
export const allowedTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
};

// Basic content checks supplement extension/MIME checks; not a malware scanner.
export function hasExpectedContent(file: Pick<Express.Multer.File, "buffer" | "originalname">): boolean {
  const data = file.buffer;
  switch (extname(file.originalname).toLowerCase()) {
    case ".pdf": return data.subarray(0, 5).equals(Buffer.from("%PDF-"));
    case ".doc": return data.subarray(0, 8).equals(Buffer.from("d0cf11e0a1b11ae1", "hex")) &&
      data.includes(Buffer.from("WordDocument", "utf16le"));
    case ".docx": return data.subarray(0, 4).equals(Buffer.from("504b0304", "hex")) &&
      data.includes(Buffer.from("[Content_Types].xml")) && data.includes(Buffer.from("word/document.xml"));
    case ".txt":
      try {
        return !new TextDecoder("utf-8", { fatal: true }).decode(data).includes("\0");
      } catch { return false; }
    default: return false;
  }
}


export function validateDocumentDetails(name: unknown, mime: unknown, size: unknown) {
  if (typeof name !== "string" || !name.trim() || Buffer.byteLength(name, "utf8") > 255 ||
      /[\x00-\x1f\x7f/\\]/.test(name))
    throw new DocumentUploadError(400, "Use a valid filename of up to 255 bytes, without paths or control characters.");
  if (!allowedTypes[extname(name).toLowerCase()] || mime !== allowedTypes[extname(name).toLowerCase()])
    throw new DocumentUploadError(415, "Only PDF, DOC, DOCX, and TXT files with matching content types are allowed.");
  if (typeof size !== "number" || !Number.isSafeInteger(size) || size <= 0)
    throw new DocumentUploadError(400, "The uploaded file must not be empty.");
  if (size > maxFileSize) throw new DocumentUploadError(413, "File exceeds the 10 MB limit.");
}


export function localDocumentStorage(): DocumentStorage {
  const directory = resolve("uploads/documents");
  return {
    kind: "local",
    async remove(document) {
      const name = document.stored_name;
      if (!name.startsWith(`${document.user_id}-`) ||
          !/^\d+-[0-9a-f-]+\.(pdf|doc|docx|txt)$/.test(name))
        throw new Error("Invalid stored document filename.");
      try { await unlink(join(directory, name)); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    },
    async save(userId, file) {
      const filename = `${userId}-${randomUUID()}${extname(file.originalname).toLowerCase()}`;
      await mkdir(directory, { recursive: true, mode: 0o700 });
      const path = join(directory, filename);
      // Exclusive creation prevents overwrites; filenames never use client paths.
      const rollback = async () => { await unlink(path); };
      try {
        await writeFile(path, file.buffer, { flag: "wx", mode: 0o600 });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
          await rollback().catch(() => {});
        }
        throw error;
      }
      return { storedName: filename, rollback };
    },
  };
}

function blobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new DocumentUploadError(503, "Document storage is not configured.");
  return token;
}

function callbackUrl(): string {
  const host = process.env.VERCEL_ENV === "production"
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  const url = process.env.BLOB_UPLOAD_CALLBACK_URL || (host && `https://${host}/api/documents/blob-callback`);
  if (!url || !url.startsWith("https://"))
    throw new DocumentUploadError(503, "Document upload callback URL is not configured.");
  return url;
}

// The browser uses upload(pathname, file, { access: 'private', handleUploadUrl:
// '/api/documents', headers: { 'X-Nuvra-Request': '1' }, clientPayload: JSON.stringify(
// { original_name, mime_type, file_size }) }). Pathname must be
// documents/<session user ID>/<UUID>.<extension>. No file bytes enter this endpoint.
export function blobDocumentStorage(): DocumentStorage {
  return {
    kind: "blob",
    async remove(document) {
      const url = new URL(document.stored_name);
      if (url.protocol !== "https:" ||
          !/^[a-z0-9-]+\.private\.blob\.vercel-storage\.com$/i.test(url.hostname) ||
          !url.pathname.startsWith(`/documents/${document.user_id}/`) ||
          !/^[0-9a-f-]+\.(pdf|doc|docx|txt)$/.test(url.pathname.split("/").pop() || "") ||
          url.pathname.split("/").length !== 4 || url.search || url.hash || url.username || url.password)
        throw new Error("Invalid stored document Blob URL.");
      await del(document.stored_name, { token: blobToken() });
    },
    async authorize(req, userId) {
      if (!Number.isSafeInteger(userId) || userId < 1)
        throw new DocumentUploadError(401, "Please log in.");
      if (!req.is("application/json") || req.body?.type !== "blob.generate-client-token")
        throw new DocumentUploadError(400, "Use the Blob client upload token flow; do not send file bytes to this endpoint.");
      const payload = req.body.payload;
      if (!payload || typeof payload.pathname !== "string" || typeof payload.clientPayload !== "string")
        throw new DocumentUploadError(400, "Missing document upload metadata.");
      return handleUpload({
        request: req,
        body: req.body,
        token: blobToken(),
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          let details;
          try { details = JSON.parse(clientPayload || "null"); }
          catch { throw new DocumentUploadError(400, "Invalid document upload metadata."); }
          validateDocumentDetails(details?.original_name, details?.mime_type, details?.file_size);
          const extension = extname(details.original_name).toLowerCase();
          const prefix = `documents/${userId}/`;
          const filename = pathname.slice(prefix.length);
          if (!pathname.startsWith(prefix) ||
              !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|doc|docx|txt)$/.test(filename) ||
              extname(filename) !== extension)
            throw new DocumentUploadError(400, "Use a new UUID filename inside your own documents folder.");
          return {
            allowedContentTypes: [allowedTypes[extension]],
            maximumSizeInBytes: maxFileSize,
            validUntil: Date.now() + 10 * 60_000,
            addRandomSuffix: false,
            allowOverwrite: false,
            callbackUrl: callbackUrl(),
            tokenPayload: JSON.stringify({ userId, pathname, original_name: details.original_name,
              mime_type: details.mime_type, file_size: details.file_size }),
          };
        },
        // Completion events must use the dedicated signature-verified endpoint.
        onUploadCompleted: async () => { throw new DocumentUploadError(400, "Use the upload callback endpoint."); },
      });
    },
  };
}

// Register before user-session middleware: Blob's server has no browser session.
// handleUpload verifies the provider signature before invoking onUploadCompleted.
export function registerDocumentBlobCallback(app: Express, repository: DocumentRepository) {
  app.post("/api/documents/blob-callback", async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!req.is("application/json") || req.body?.type !== "blob.upload-completed")
      return res.status(400).json({ error: "Expected a signed Blob completion notification." });
    let verified = false;
    let document: DocumentMetadata | undefined;
    try {
      const token = blobToken();
      const result = await handleUpload({
        request: req, body: req.body, token,
        onBeforeGenerateToken: async () => { throw new DocumentUploadError(401, "Please log in."); },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          verified = true;
          const details = JSON.parse(tokenPayload || "null");
          if (!details || !Number.isSafeInteger(details.userId) || details.userId < 1 ||
              typeof details.pathname !== "string" || !details.pathname.startsWith(`documents/${details.userId}/`) ||
              blob.pathname !== details.pathname ||
              !/^https:\/\/[a-z0-9-]+\.private\.blob\.vercel-storage\.com\//i.test(blob.url))
            throw new DocumentUploadError(400, "Invalid private document upload notification.");
          validateDocumentDetails(details.original_name, details.mime_type, details.file_size);

          // Read from our configured private store, never an arbitrary client URL.
          const stored = await get(details.pathname, { access: "private", token, useCache: false });
          if (!stored || stored.statusCode !== 200 || !stored.stream)
            throw new DocumentUploadError(503, "Could not verify the stored document.");
          const reader = stored.stream.getReader();
          const chunks: Uint8Array[] = [];
          let size = 0;
          try {
            validateDocumentDetails(details.original_name, stored.blob.contentType, stored.blob.size);
            if (stored.blob.url !== blob.url || stored.blob.size !== details.file_size ||
                stored.blob.contentType !== details.mime_type)
              throw new DocumentUploadError(400, "Stored document does not match the authorized upload.");
            for (;;) {
              const part = await reader.read();
              if (part.done) break;
              size += part.value.byteLength;
              if (size > maxFileSize) throw new DocumentUploadError(413, "File exceeds the 10 MB limit.");
              chunks.push(part.value);
            }
            if (size !== details.file_size || !hasExpectedContent({
              originalname: details.original_name, buffer: Buffer.concat(chunks),
            })) throw new DocumentUploadError(415, "File contents do not match the supported document type.");
          } catch (error) {
            if (error instanceof DocumentUploadError && error.status < 500) {
              await del(details.pathname, { token }).catch(() => {
                console.error("Invalid document upload cleanup failed.");
              });
            }
            throw error;
          } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }

          try {
            document = await repository.createDocument(details.userId, {
              original_name: details.original_name, stored_name: stored.blob.url,
              mime_type: stored.blob.contentType!, file_size: size,
            });
          } catch {
            // Keep the Blob so a signed retry can finish metadata persistence.
            throw new DocumentUploadError(500, "Could not save document metadata. The upload completion must be retried.");
          }
        },
      });
      res.json({ ...result, document });
    } catch (error) {
      if (error instanceof DocumentUploadError)
        return res.status(error.status).json({ error: error.message });
      return res.status(verified ? 503 : 403).json({ error: verified
        ? "Could not verify document storage. Please retry the completion notification."
        : "Invalid Blob completion signature or payload." });
    }
  });
}
