import { useEffect, useState } from "react";
import type { CustomerRequest, RequestFilters } from "../../../shared/requests";
import { listRequests } from "./api";
import { RequestSearch } from "./RequestSearch";
import { RequestList } from "./RequestList";
import "./requests.css";

export function RequestsPanel({ canManageRequests = false }: { canManageRequests?: boolean }) {
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<RequestFilters>({});
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    listRequests(filters).then(records => { if (active) setRequests(records); })
      .catch(failure => { if (active) setError(failure instanceof Error ? failure.message : "Could not load requests."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload, filters]);

  function refresh() {
    setLoading(true);
    setError("");
    setReload(value => value + 1);
  }

  function search(next: RequestFilters) {
    setLoading(true);
    setError("");
    setFilters(next);
  }

  return <section className="requests-panel" aria-labelledby="requests-heading">
    <h2 id="requests-heading">{canManageRequests ? "Customer requests" : "My requests"}</h2>
    <p>{canManageRequests ? "Review customer requests and keep their progress up to date." : "View your submitted requests and track their progress."}</p>
    <RequestSearch canManageRequests={canManageRequests} onSearch={search} />
    <div className="request-list-heading">
      <h3>{canManageRequests ? "All requests" : "Request history"}</h3>
      <button className="admin-secondary" disabled={loading} onClick={refresh}>Refresh requests</button>
    </div>
    {loading && <p role="status">Loading requests…</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {!loading && !error && <>
      <p role="status">{requests.length} {requests.length === 1 ? "request" : "requests"} found.</p>
      <RequestList requests={requests} canManageRequests={canManageRequests} onUpdated={refresh} />
    </>}
  </section>;
}
