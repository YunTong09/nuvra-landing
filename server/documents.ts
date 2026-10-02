import { Router, type Express, type ErrorRequestHandler } from "express";
import multer from "multer";
import { extname } from "node:path";
import { allowedTypes, maxFileSize, hasExpectedContent, validateDocumentDetails, DocumentUploadError,
  type DocumentStorage, type StoredDocument } from "./document-storage.js";

class UnsupportedDocumentError extends Error {}

const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize, files: 1, fields: 0, parts: 2 },
  fileFilter: (_req, file, done) => {
    const expected = allowedTypes[extname(file.originalname).toLowerCase()];
    if (!expected || file.mimetype !== expected)
      return done(new UnsupportedDocumentError("Only PDF, DOC, DOCX, and TXT files with matching content types are allowed."));
    done(null, true);
  },
}).single("file");

export type DocumentMetadataInput = {
  original_name: string;
  stored_name: string;
  mime_type: string;
  file_size: number;
};
export type DocumentMetadata = DocumentMetadataInput & {
  id: number;
  user_id: number;
  created_at: string;
};

export interface DocumentRepository {
  createDocument(userId: number, input: DocumentMetadataInput): Promise<DocumentMetadata>;
  getDocumentsByUser(userId: number): Promise<DocumentMetadata[]>;
  getDocumentByIdForUser(documentId: number, userId: number): Promise<DocumentMetadata | undefined>;
  deleteDocument(documentId: number, userId: number): Promise<boolean>;
  // Compatibility methods used by the existing routes.
  create(userId: number, input: DocumentMetadataInput): Promise<DocumentMetadata>;
  listForUser(userId: number): Promise<DocumentMetadata[]>;
  findForUser(id: number, userId: number): Promise<DocumentMetadata | undefined>;
  // Implementations must enforce ownership in the delete operation itself.
  deleteForUser(id: number, userId: number): Promise<boolean>;
}

export class DocumentsNotImplementedError extends Error {
  constructor() {
    super("Document management is not available yet.");
    this.name = "DocumentsNotImplementedError";
  }
}

export function registerDocuments(app: Express, repository: DocumentRepository, storage?: DocumentStorage) {
  const router = Router();
  // Existing authentication middleware supplies the session user before this router.
  router.use((_req, res, next) => {
    if (!res.locals.user) return res.status(401).json({ error: "Please log in." });
    next();
  });

  router.post("/", async (req, res) => {
    if (storage?.kind === "blob") {
      try { return res.json(await storage.authorize(req, res.locals.user.id)); }
      catch (error) {
        if (error instanceof DocumentUploadError)
          return res.status(error.status).json({ error: error.message });
        return res.status(503).json({ error: "Could not authorize document storage. Please try again later." });
      }
    }
    try {
      await new Promise<void>((resolve, reject) => {
        uploadDocument(req, res, error => error ? reject(error) : resolve());
      });
    } catch (error) {
      if (error instanceof UnsupportedDocumentError)
        return res.status(415).json({ error: error.message });
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE")
          return res.status(413).json({ error: "File exceeds the 10 MB limit." });
        return res.status(400).json({ error: "Send exactly one file using the 'file' field, with no additional fields." });
      }
      return res.status(400).json({ error: "Invalid multipart upload." });
    }
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Upload one file using the 'file' field." });
    try { validateDocumentDetails(file.originalname, file.mimetype, file.size); }
    catch (error) {
      if (error instanceof DocumentUploadError)
        return res.status(error.status).json({ error: error.message });
      throw error;
    }
    if (!hasExpectedContent(file))
      return res.status(415).json({ error: "File contents do not match the supported document type. TXT files must use UTF-8." });
    if (!storage) return res.status(503).json({ error: "Document storage is not configured." });

    const userId = res.locals.user.id;
    let stored: StoredDocument;
    try {
      stored = await storage.save(userId, file);
    } catch {
      return res.status(503).json({ error: "Could not store the document. Please try again later." });
    }
    let document: DocumentMetadata;
    try {
      document = await repository.createDocument(userId, {
        original_name: file.originalname,
        stored_name: stored.storedName,
        mime_type: file.mimetype,
        file_size: file.size,
      });
    } catch {
      try { await stored.rollback(); }
      catch { console.error("Document upload cleanup failed after metadata creation failed."); }
      return res.status(500).json({ error: "Could not save document metadata. Please try again later." });
    }
    res.status(201).json(document);
  });

  router.get("/", async (_req, res) => {
    try {
      const documents = await repository.getDocumentsByUser(res.locals.user.id);
      return res.status(200).json(documents);
    } catch {
      return res.status(500).json({ error: "Could not retrieve documents. Please try again later." });
    }
  });

  router.delete("/:id", async (req, res) => {
    const rawId = req.params.id;
    const id = Number(rawId);
    if (typeof rawId !== "string" || !/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id < 1)
      return res.status(400).json({ error: "Invalid document ID." });
    if (!await repository.deleteForUser(id, res.locals.user.id))
      return res.status(404).json({ error: "Document not found." });
    res.status(204).end();
  });

  const handleNotImplemented: ErrorRequestHandler = (error, _req, res, next) => {
    if (error instanceof DocumentsNotImplementedError)
      return res.status(501).json({ error: error.message });
    next(error);
  };
  router.use(handleNotImplemented);
  app.use("/api/documents", router);
}
