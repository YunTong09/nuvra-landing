import { useEffect, useState } from "react";
import type { CustomerRequest } from "../../../shared/requests";
import { listRequests } from "./api";
import { RequestList } from "./RequestList";
import "./requests.css";

export function RequestsPanel({ isAdmin = false }: { isAdmin?: boolean }) {
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    listRequests().then(records => { if (active) setRequests(records); })
      .catch(failure => { if (active) setError(failure instanceof Error ? failure.message : "Could not load requests."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  function refresh() {
    setLoading(true);
    setError("");
    setReload(value => value + 1);
  }

  function updated(record: CustomerRequest) {
    setRequests(current => current.map(item => item.id === record.id ? record : item));
  }

  return <section className="requests-panel" aria-labelledby="requests-heading">
    <h2 id="requests-heading">{isAdmin ? "Customer requests" : "My requests"}</h2>
    <p>{isAdmin ? "Review customer requests and keep their progress up to date." : "View your submitted requests and track their progress."}</p>
    <div className="request-list-heading">
      <h3>{isAdmin ? "All requests" : "Request history"}</h3>
      <button className="admin-secondary" disabled={loading} onClick={refresh}>Refresh requests</button>
    </div>
    {loading && <p role="status">Loading requests…</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {!loading && !error && <RequestList requests={requests} isAdmin={isAdmin} onUpdated={updated} />}
  </section>;
}
