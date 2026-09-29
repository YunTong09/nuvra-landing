import { SearchBar } from "../search/SearchBar";
import { ClientForm } from "./ClientForm";
import { ClientList } from "./ClientList";
import { listClients, saveClient, deleteClient } from "./api";
import { useEffect, useState, type FormEvent } from "react";
import type { Client } from "./types";

export function ClientsAdmin() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  useEffect(() => {
    let cancelled = false;
    listClients(query)
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
  }, [query, reload]);
  function refresh() {
    setLoading(true);
    setError("");
    setReload(value => value + 1);
  }
  function search(value: string) {
    setQuery(value);
    refresh();
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
      await saveClient(editing?.id ?? null, {
        name: String(fields.get("name") ?? ""), email: String(fields.get("email") ?? ""),
      });
      refresh();
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
      await deleteClient(client.id);
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
      <SearchBar label="Search clients" placeholder="Name, email or client ID" disabled={busy} onSearch={search} />
      {!loading && !error && <p role="status">{clients.length} results found.</p>}
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
        <ClientForm key={editing?.id ?? "new"} editing={editing} busy={busy}
          onSave={save} onCancel={() => setShowForm(false)} />
      )}
      {loading ? (
        <p role="status">Loading clients…</p>
      ) : clients.length === 0 && !error ? (
        <p className="admin-description">
          No clients found. Try another search or clear the search.
        </p>
      ) : (
        <ClientList clients={clients} busy={busy} onEdit={openForm} onDelete={remove} />
      )}
    </section>
  );
}
