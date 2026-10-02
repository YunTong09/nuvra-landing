import type Database from "better-sqlite3";
import type { DocumentMetadata, DocumentMetadataInput, DocumentRepository } from "../documents.js";

export function sqliteDocuments(db: Database.Database): DocumentRepository {
  async function createDocument(userId: number, input: DocumentMetadataInput): Promise<DocumentMetadata> {
    const result = db.prepare(`INSERT INTO documents
      (user_id, original_name, stored_name, mime_type, file_size)
      VALUES (?, ?, ?, ?, ?)`).run(userId, input.original_name, input.stored_name, input.mime_type, input.file_size);
    return db.prepare("SELECT * FROM documents WHERE id = ? AND user_id = ?")
      .get(result.lastInsertRowid, userId) as DocumentMetadata;
  }

  async function getDocumentsByUser(userId: number): Promise<DocumentMetadata[]> {
    return db.prepare("SELECT * FROM documents WHERE user_id = ? ORDER BY id DESC")
      .all(userId) as DocumentMetadata[];
  }

  async function getDocumentByIdForUser(documentId: number, userId: number): Promise<DocumentMetadata | undefined> {
    return db.prepare("SELECT * FROM documents WHERE id = ? AND user_id = ?")
      .get(documentId, userId) as DocumentMetadata | undefined;
  }

  async function deleteDocument(documentId: number, userId: number): Promise<boolean> {
    return db.prepare("DELETE FROM documents WHERE id = ? AND user_id = ?")
      .run(documentId, userId).changes > 0;
  }

  return {
    createDocument, getDocumentsByUser, getDocumentByIdForUser, deleteDocument,
    create: createDocument,
    listForUser: getDocumentsByUser,
    findForUser: getDocumentByIdForUser,
    deleteForUser: deleteDocument,
  };
}
