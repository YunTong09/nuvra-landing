import { useEffect, useRef, useState, type FormEvent } from "react";
import { adminRequest, type Client } from "../api";

export function ClientsAdmin() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const firstInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let cancelled = false;
    adminRequest("clients")
      .then((items) => {
        if (!cancelled) setClients(items);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load clients. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (showForm) firstInput.current?.focus();
  }, [showForm, editing]);
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setClients(await adminRequest("clients"));
    } catch {
      setError("Could not load clients. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  function openForm(client: Client | null) {
    setEditing(client);
    setShowForm(true);
    setError("");
    setNotice("");
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const saved: Client = await adminRequest(
        `clients${editing ? `/${editing.id}` : ""}`,
        editing ? "PUT" : "POST",
        { name: fields.get("name"), email: fields.get("email") },
      );
      setClients((items) =>
        editing
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [...items, saved],
      );
      setShowForm(false);
      setNotice(editing ? "Client updated." : "Client added.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save client.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove(client: Client) {
    if (
      busy ||
      !window.confirm(
        `Delete ${client.name}? Linked subscriptions must be removed first.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await adminRequest(`clients/${client.id}`, "DELETE");
      setClients((items) => items.filter((item) => item.id !== client.id));
      if (editing?.id === client.id) setShowForm(false);
      setNotice("Client deleted.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not delete client.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Clients">
      <div className="admin-actions">
        <button
          className="button"
          disabled={busy || loading}
          onClick={() => openForm(null)}
        >
          + Add Client
        </button>
        <button
          className="admin-secondary"
          disabled={busy || loading}
          onClick={refresh}
        >
          Refresh list
        </button>
      </div>
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
      <p role="status" className="admin-notice">
        {notice}
      </p>
      {showForm && (
        <form
          key={editing?.id ?? "new"}
          className="contact-form admin-form"
          onSubmit={save}
        >
          <h2>{editing ? "Edit client" : "Add client"}</h2>
          <fieldset className="contact-fields" disabled={busy}>
            <label htmlFor="client-name">
              Client name
              <input
                ref={firstInput}
                id="client-name"
                name="name"
                defaultValue={editing?.name ?? ""}
                required
                maxLength={100}
              />
            </label>
            <label htmlFor="client-email">
              Email
              <input
                id="client-email"
                name="email"
                type="email"
                defaultValue={editing?.email ?? ""}
                required
                maxLength={254}
              />
            </label>
          </fieldset>
          <div className="admin-actions">
            <button className="button" disabled={busy}>
              {busy ? "Saving…" : "Save Client"}
            </button>
            <button
              type="button"
              className="admin-cancel"
              disabled={busy}
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {loading ? (
        <p role="status">Loading clients…</p>
      ) : clients.length === 0 && !error ? (
        <p className="admin-description">
          No clients yet. Add a client before creating a subscription.
        </p>
      ) : (
        <div
          className="admin-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Client records"
        >
          <table className="admin-table">
            <caption>Clients</caption>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Created (UTC)</th>
                <th>Updated (UTC)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.id}</td>
                  <td>{client.name}</td>
                  <td>{client.email}</td>
                  <td>
                    <time dateTime={client.created_at}>
                      {client.created_at}
                    </time>
                  </td>
                  <td>
                    <time dateTime={client.updated_at}>
                      {client.updated_at}
                    </time>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="admin-secondary"
                        disabled={busy}
                        onClick={() => openForm(client)}
                        aria-label={`Edit ${client.name}`}
                      >
                        Edit
                      </button>
                      <button
                        className="admin-secondary admin-delete"
                        disabled={busy}
                        onClick={() => remove(client)}
                        aria-label={`Delete ${client.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
