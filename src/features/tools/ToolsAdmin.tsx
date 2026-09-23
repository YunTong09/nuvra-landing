import { useEffect, useRef, useState, type FormEvent } from "react";
import { loadTools, saveTool as persistTool, deleteTool as removeTool } from "./api";
import type { Tool } from "./types";

export function ToolsAdmin() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const titleInput = useRef<HTMLInputElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);

  async function refreshTools() {
    setLoading(true);
    setError("");
    try {
      setTools(await loadTools());
    } catch {
      setError(
        "Could not load tools. Check that the backend is running, then try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let cancelled = false;
    loadTools()
      .then((items) => {
        if (!cancelled) setTools(items);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load tools. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (showForm) titleInput.current?.focus();
  }, [showForm, editingId]);

  function openForm(tool?: Tool) {
    setEditingId(tool?.id ?? null);
    setTitle(tool?.title ?? "");
    setDescription(tool?.description ?? "");
    setError("");
    setNotice("");
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    addButton.current?.focus();
  }

  async function saveTool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const saved = await persistTool(editingId, { title, description });
      setTools((current) =>
        editingId === null
          ? [...current, saved]
          : current.map((tool) => (tool.id === saved.id ? saved : tool)),
      );
      setNotice(editingId === null ? "Tool added." : "Tool updated.");
      closeForm();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not save the tool. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteTool(tool: Tool) {
    if (
      busy ||
      !window.confirm(`Delete “${tool.title}”? This cannot be undone.`)
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await removeTool(tool.id);
      setTools((current) => current.filter((item) => item.id !== tool.id));
      if (editingId === tool.id) closeForm();
      setNotice("Tool deleted.");
      addButton.current?.focus();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not delete the tool. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Tools">
      <button
        ref={addButton}
        className="button"
        disabled={busy || loading}
        onClick={() => openForm()}
      >
        + Add Tool
      </button>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <p className="admin-notice" role="status">
        {notice}
      </p>
      {showForm && (
        <form className="contact-form admin-form" onSubmit={saveTool}>
          <h2>{editingId === null ? "Add tool" : "Edit tool"}</h2>
          <fieldset disabled={busy} className="contact-fields">
            <label htmlFor="tool-title">
              Tool title
              <input
                ref={titleInput}
                id="tool-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={100}
              />
            </label>
            <label htmlFor="tool-description">
              Description
              <textarea
                id="tool-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                maxLength={1000}
                rows={4}
              />
            </label>
          </fieldset>
          <div className="admin-actions">
            <button className="button" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save Tool"}
            </button>
            <button
              className="admin-cancel"
              type="button"
              disabled={busy}
              onClick={closeForm}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="admin-list" aria-busy={loading || busy}>
        {loading ? (
          <p role="status">Loading tools…</p>
        ) : (
          <>
            <button
              className="admin-secondary"
              disabled={busy}
              onClick={refreshTools}
            >
              Refresh list
            </button>
            {tools.length === 0 && !error && (
              <p>No tools yet. Add your first tool above.</p>
            )}
            {tools.map((tool) => (
              <article className="admin-item" key={tool.id}>
                <div>
                  <h2>{tool.title}</h2>
                  <p>{tool.description}</p>
                  <p className="admin-record-meta">
                    ID: {tool.id} · Created (UTC): {tool.created_at}
                    <br />
                    Updated (UTC): {tool.updated_at}
                  </p>
                </div>
                <div className="admin-actions">
                  <button
                    className="admin-secondary"
                    disabled={busy}
                    aria-label={`Edit ${tool.title}`}
                    onClick={() => openForm(tool)}
                  >
                    Edit
                  </button>
                  <button
                    className="admin-secondary admin-delete"
                    disabled={busy}
                    aria-label={`Delete ${tool.title}`}
                    onClick={() => deleteTool(tool)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
