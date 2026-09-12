import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  adminRequest,
  type Client,
  type Tool,
  type Subscription,
} from "../api";

export function SubscriptionsAdmin() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [showForm, setShowForm] = useState(false);
  const firstInput = useRef<HTMLSelectElement>(null);
  async function readData() {
    return Promise.all([
      adminRequest("subscriptions"),
      adminRequest("clients"),
      adminRequest("tools"),
    ]);
  }
  useEffect(() => {
    let cancelled = false;
    readData()
      .then(([records, people, offerings]) => {
        if (!cancelled) {
          setSubscriptions(records);
          setClients(people);
          setTools(offerings);
        }
      })
      .catch(() => {
        if (!cancelled)
          setError("Could not load subscriptions. Please try again.");
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
      const [records, people, offerings] = await readData();
      setSubscriptions(records);
      setClients(people);
      setTools(offerings);
    } catch {
      setError("Could not load subscriptions. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  function openForm(record: Subscription | null) {
    setEditing(record);
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
      const saved: Subscription = await adminRequest(
        `subscriptions${editing ? `/${editing.id}` : ""}`,
        editing ? "PUT" : "POST",
        {
          client_id: Number(fields.get("client_id")),
          tool_id: Number(fields.get("tool_id")),
          status: fields.get("status"),
        },
      );
      setSubscriptions((items) =>
        editing
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [...items, saved],
      );
      setShowForm(false);
      setNotice(editing ? "Subscription updated." : "Subscription added.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save subscription.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove(record: Subscription) {
    if (
      busy ||
      !window.confirm(
        `Permanently remove ${record.client_name}’s subscription to ${record.tool_title}? To keep its history, edit its status to cancelled instead.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await adminRequest(`subscriptions/${record.id}`, "DELETE");
      setSubscriptions((items) =>
        items.filter((item) => item.id !== record.id),
      );
      if (editing?.id === record.id) setShowForm(false);
      setNotice("Subscription deleted.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not delete subscription.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Subscriptions">
      <div className="admin-actions">
        <button
          className="button"
          disabled={busy || loading || !clients.length || !tools.length}
          onClick={() => openForm(null)}
        >
          + Add Subscription
        </button>
        <button
          className="admin-secondary"
          disabled={busy || loading}
          onClick={refresh}
        >
          Refresh list
        </button>
      </div>
      {!loading && (!clients.length || !tools.length) && (
        <p className="admin-description">
          Add at least one client and one tool to create a subscription.
        </p>
      )}
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
          <h2>{editing ? "Edit subscription" : "Add subscription"}</h2>
          <fieldset className="contact-fields" disabled={busy}>
            <label htmlFor="subscription-client">
              Client
              <select
                ref={firstInput}
                id="subscription-client"
                name="client_id"
                defaultValue={editing?.client_id ?? ""}
                required
              >
                <option value="" disabled>
                  Choose a client
                </option>
                {clients.map((client) => (
                  <option value={client.id} key={client.id}>
                    {client.name} — {client.email} (#{client.id})
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="subscription-tool">
              Tool
              <select
                id="subscription-tool"
                name="tool_id"
                defaultValue={editing?.tool_id ?? ""}
                required
              >
                <option value="" disabled>
                  Choose a tool
                </option>
                {tools.map((tool) => (
                  <option value={tool.id} key={tool.id}>
                    {tool.title} (#{tool.id})
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="subscription-status">
              Status
              <select
                id="subscription-status"
                name="status"
                defaultValue={editing?.status ?? "active"}
              >
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </fieldset>
          <div className="admin-actions">
            <button className="button" disabled={busy}>
              {busy ? "Saving…" : "Save Subscription"}
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
        <p role="status">Loading subscriptions…</p>
      ) : subscriptions.length === 0 && !error ? (
        <p className="admin-description">No subscriptions yet.</p>
      ) : (
        <div
          className="admin-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Subscription records"
        >
          <table className="admin-table">
            <caption>Subscriptions</caption>
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Tool</th>
                <th>Status</th>
                <th>Created (UTC)</th>
                <th>Updated (UTC)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>
                    {record.client_name}
                    <small>
                      {record.client_email} · #{record.client_id}
                    </small>
                  </td>
                  <td>
                    {record.tool_title}
                    <small>#{record.tool_id}</small>
                  </td>
                  <td>{record.status}</td>
                  <td>
                    <time dateTime={record.created_at}>
                      {record.created_at}
                    </time>
                  </td>
                  <td>
                    <time dateTime={record.updated_at}>
                      {record.updated_at}
                    </time>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="admin-secondary"
                        disabled={busy}
                        onClick={() => openForm(record)}
                        aria-label={`Edit subscription ${record.id}`}
                      >
                        Edit
                      </button>
                      <button
                        className="admin-secondary admin-delete"
                        disabled={busy}
                        onClick={() => remove(record)}
                        aria-label={`Delete subscription ${record.id}`}
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
