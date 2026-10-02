import type { Pool } from "pg";
import type { DocumentMetadata, DocumentMetadataInput, DocumentRepository } from "../documents.js";

type DocumentRow = Omit<DocumentMetadata, "file_size" | "created_at"> & {
  file_size: string | number;
  created_at: Date | string;
};

function metadata(row: DocumentRow): DocumentMetadata {
  return { ...row, file_size: Number(row.file_size), created_at: new Date(row.created_at).toISOString() };
}

export function postgresDocuments(db: Pool): DocumentRepository {
  async function createDocument(userId: number, input: DocumentMetadataInput): Promise<DocumentMetadata> {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      // Serialize retries of the same signed Blob completion without a schema change.
      await client.query("SELECT pg_advisory_xact_lock($1, hashtext($2))", [userId, input.stored_name]);
      const existing = await client.query<DocumentRow>(
        "SELECT * FROM documents WHERE user_id = $1 AND stored_name = $2", [userId, input.stored_name]);
      const result = existing.rows.length ? existing : await client.query<DocumentRow>(`INSERT INTO documents
        (user_id, original_name, stored_name, mime_type, file_size)
        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, input.original_name, input.stored_name, input.mime_type, input.file_size]);
      await client.query("COMMIT");
      return metadata(result.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  }

  async function getDocumentsByUser(userId: number): Promise<DocumentMetadata[]> {
    const result = await db.query<DocumentRow>(
      "SELECT * FROM documents WHERE user_id = $1 ORDER BY id DESC", [userId]);
    return result.rows.map(metadata);
  }

  async function getDocumentByIdForUser(documentId: number, userId: number): Promise<DocumentMetadata | undefined> {
    const result = await db.query<DocumentRow>(
      "SELECT * FROM documents WHERE id = $1 AND user_id = $2", [documentId, userId]);
    return result.rows[0] ? metadata(result.rows[0]) : undefined;
  }

  async function deleteDocument(documentId: number, userId: number): Promise<boolean> {
    const result = await db.query("DELETE FROM documents WHERE id = $1 AND user_id = $2", [documentId, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  return {
    createDocument, getDocumentsByUser, getDocumentByIdForUser, deleteDocument,
    create: createDocument,
    listForUser: getDocumentsByUser,
    findForUser: getDocumentByIdForUser,
    deleteForUser: deleteDocument,
  };
}
