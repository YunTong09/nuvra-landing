import { SubscriptionForm } from "./SubscriptionForm";
import { SubscriptionList } from "./SubscriptionList";
import { loadSubscriptionData, saveSubscription, deleteSubscription } from "./api";
import { useEffect, useState, type FormEvent } from "react";
import type { Client } from "../clients/types";
import type { Tool } from "../tools/types";
import type { Subscription } from "./types";

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
  useEffect(() => {
    let cancelled = false;
    loadSubscriptionData()
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
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const [records, people, offerings] = await loadSubscriptionData();
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
      const saved = await saveSubscription(editing?.id ?? null, {
        client_id: Number(fields.get("client_id")),
        tool_id: Number(fields.get("tool_id")),
        status: String(fields.get("status")) as Subscription["status"],
      });
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
      await deleteSubscription(record.id);
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
        <SubscriptionForm key={editing?.id ?? "new"} editing={editing} busy={busy}
          onSave={save} onCancel={() => setShowForm(false)} clients={clients} tools={tools} />
      )}
      {loading ? (
        <p role="status">Loading subscriptions…</p>
      ) : subscriptions.length === 0 && !error ? (
        <p className="admin-description">No subscriptions yet.</p>
      ) : (
        <SubscriptionList subscriptions={subscriptions} busy={busy} onEdit={openForm} onDelete={remove} />
      )}
    </section>
  );
}
