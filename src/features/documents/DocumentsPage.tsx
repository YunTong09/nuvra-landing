import { useEffect, useRef, useState, type FormEvent } from "react";
import { Brand } from "../../components/Icon";
import { currentUser, spacePath, type CurrentUser } from "../account/auth";
import { deleteDocument, listDocuments, uploadDocument, validateFile, type DocumentRecord } from "./api";
import "./documents.css";

const message = (error: unknown) => error instanceof Error ? error.message : "Please try again later.";
const sizeLabel = (size: number) => size < 1024 ? `${size} B` : size < 1024 * 1024
  ? `${(size / 1024).toFixed(1)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;

export function DocumentsPage({ embedded = false }: { embedded?: boolean }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const alive = useRef(false);

  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    async function initialize() {
      const found = await currentUser();
      if (cancelled) return;
      if (!found) { window.location.replace("/login"); return; }
      setUser(found);
      try {
        const rows = await listDocuments();
        if (!cancelled) { setDocuments(rows); setLoaded(true); }
      } catch (failure) { if (!cancelled) setError(message(failure)); }
      finally { if (!cancelled) setLoading(false); }
    }
    void initialize();
    return () => { cancelled = true; alive.current = false; };
  }, []);

  async function refresh() {
    setLoading(true); setError("");
    try {
      const rows = await listDocuments();
      if (!alive.current) return;
      setDocuments(rows); setLoaded(true);
      if (pending && rows.some(row => row.stored_name === pending)) {
        setPending(null); setNotice("Document uploaded successfully.");
      }
    } catch (failure) { if (alive.current) setError(message(failure)); }
    finally { if (alive.current) setLoading(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || loading || !user) return;
    setError(""); setNotice("");
    const invalid = validateFile(file);
    if (invalid) { setError(invalid); return; }
    setBusy(true);
    try {
      const storedName = await uploadDocument(file!, user.id);
      if (!alive.current) return;
      setFile(null); if (picker.current) picker.current.value = "";
      setPending(storedName);
      setNotice("File transferred. Waiting for server verification…");
      // Blob metadata is created asynchronously by the signed completion callback.
      for (let attempt = 0; attempt < 15; attempt++) {
        if (attempt) await new Promise(resolve => setTimeout(resolve, 2000));
        if (!alive.current) return;
        const rows = await listDocuments();
        if (!alive.current) return;
        setDocuments(rows); setLoaded(true);
        if (rows.some(row => row.stored_name === storedName)) {
          setPending(null); setNotice("Document uploaded successfully."); return;
        }
      }
      setNotice("File transferred, but server verification is still pending. Refresh the list shortly; do not upload it again yet.");
    } catch (failure) { if (alive.current) setError(message(failure)); }
    finally { if (alive.current) setBusy(false); }
  }

  async function remove(document: DocumentRecord) {
    if (deleting !== null || busy || loading) return;
    if (!window.confirm(`Delete “${document.original_name}”? This cannot be undone.`)) return;
    setDeleting(document.id); setError(""); setNotice("");
    try {
      await deleteDocument(document.id);
      if (!alive.current) return;
      setDocuments(rows => rows.filter(row => row.id !== document.id));
      setNotice("Document deleted.");
    } catch (failure) { if (alive.current) setError(message(failure)); }
    finally { if (alive.current) setDeleting(null); }
  }

  const content = !user ? <p role="status">Checking your account…</p> : <>
        <form className="contact-form auth-form" onSubmit={submit} aria-label="Upload document">
          <h2>Upload a document</h2>
          <p id="document-help">PDF, DOC, DOCX or UTF-8 TXT. Maximum 10 MB per file.</p>
          <fieldset className="contact-fields auth-fields" disabled={busy || deleting !== null}>
            <label htmlFor="document-file">Choose file
              <input ref={picker} id="document-file" type="file" accept=".pdf,.doc,.docx,.txt" aria-describedby="document-help"
                onChange={event => { const selected = event.target.files?.[0] || null; setFile(selected); setError(selected ? validateFile(selected) : ""); }} />
            </label>
          </fieldset>
          <p className="document-filename">{file ? file.name : "No file selected"}</p>
          <button className="contact-submit" disabled={busy || loading || deleting !== null} type="submit">{busy ? "Uploading / verifying…" : "Upload"}</button>
        </form>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        <section className="documents-list" aria-labelledby="my-documents" aria-busy={loading}>
          <div className="documents-heading"><h2 id="my-documents">My Documents</h2>
            <button type="button" onClick={() => void refresh()} disabled={loading || busy || deleting !== null}>Refresh</button></div>
          {loading && <p role="status">Loading documents…</p>}
          {!loading && loaded && !documents.length && <p>No documents yet. Upload your first file above.</p>}
          <ul>{documents.map(document => <li key={document.id} className="document-row">
            <div><h3 className="document-filename">{document.original_name}</h3>
              <p>{document.original_name.split(".").pop()?.toUpperCase()} · {sizeLabel(document.file_size)}</p>
              <p>Uploaded <time dateTime={document.created_at}>{new Date(document.created_at).toLocaleString()}</time></p></div>
            <button type="button" aria-label={`Delete ${document.original_name}`} disabled={busy || loading || deleting !== null}
              onClick={() => void remove(document)}>{deleting === document.id ? "Deleting…" : "Delete"}</button>
          </li>)}</ul>
        </section>
      </>;

  if (embedded) return <div className="documents-page">{content}</div>;

  return <div className={user && (user.role === "admin" || user.role === "employee")
    ? `staff-workspace staff-workspace--${user.role}` : undefined}>
    <a className="skip-link" href="#documents-content">Skip to content</a>
    <header className="site-header"><div className="container nav-wrap">
      <a href="/" aria-label="Nuvra home"><Brand /></a>
      <nav className="account-nav" aria-label="Document navigation"><a href={spacePath(user)}>My space</a><a href="/">Website</a></nav>
    </div></header>
    <main id="documents-content" className="section account-page"><div className="container account-container documents-page">
      <p className="section-label">YOUR NUVRA DOCUMENTS</p><h1>File &amp; Document Management</h1>
      {content}
    </div></main>
  </div>;
}
