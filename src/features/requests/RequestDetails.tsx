import { useEffect, useState } from "react";
import { getRequest, updateRequestStatus } from "./api";
import { requestStatuses, requestStatusLabels, type CustomerRequest, type RequestStatus } from "../../../shared/requests";

export function RequestDetails({ id, isAdmin, onUpdated }: {
  id: number; isAdmin: boolean; onUpdated: (request: CustomerRequest) => void;
}) {
  const [record, setRecord] = useState<CustomerRequest | null>(null);
  const [status, setStatus] = useState<RequestStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    getRequest(id).then(found => {
      if (active) { setRecord(found); setStatus(found.status); }
    }).catch(failure => {
      if (active) setError(failure instanceof Error ? failure.message : "Could not load request.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, reload]);

  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await updateRequestStatus(id, status);
      setRecord(updated);
      onUpdated(updated);
      setNotice("Request status updated.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not update status.");
    } finally { setBusy(false); }
  }

  return <section className="request-details" aria-label={`Request ${id} details`}>
    {loading ? <p role="status">Loading request details…</p> : record && <>
      <h3>Request #{record.id}: {record.subject}</h3>
      {isAdmin && <p>From {record.customer_name} · {record.customer_email}</p>}
      <p><strong>Status:</strong> {requestStatusLabels[record.status]}</p>
      <p className="request-message">{record.message}</p>
      <p className="admin-record-meta">Submitted: {new Date(record.created_at).toLocaleString()}<br />
        Last updated: {new Date(record.updated_at).toLocaleString()}</p>
      {isAdmin && <div className="request-status-editor">
        <label htmlFor={`request-status-${id}`}>Status
          <select id={`request-status-${id}`} value={status} disabled={busy}
            onChange={event => setStatus(event.target.value as RequestStatus)}>
            {requestStatuses.map(value => <option key={value} value={value}>{requestStatusLabels[value]}</option>)}
          </select>
        </label>
        <button className="button" disabled={busy || status === record.status} onClick={save}>
          {busy ? "Saving…" : "Save status"}
        </button>
      </div>}
    </>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {!loading && !record && <button className="admin-secondary" onClick={() => { setLoading(true); setError(""); setReload(value => value + 1); }}>Try again</button>}
    <p role="status">{notice}</p>
  </section>;
}
