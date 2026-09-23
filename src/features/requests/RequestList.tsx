import { useState } from "react";
import { requestStatusLabels, requestStatuses, type CustomerRequest, type RequestStatus } from "../../../shared/requests";
import { RequestDetails } from "./RequestDetails";

export function RequestList({ requests, isAdmin, onUpdated }: {
  requests: CustomerRequest[]; isAdmin: boolean; onUpdated: (request: CustomerRequest) => void;
}) {
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const [selected, setSelected] = useState<number | null>(null);
  const visible = requests.filter(request => filter === "all" || request.status === filter);
  return <>
    <label className="request-filter">Filter by status
      <select value={filter} onChange={event => setFilter(event.target.value as RequestStatus | "all")}>
        <option value="all">All statuses</option>
        {requestStatuses.map(status => <option key={status} value={status}>{requestStatusLabels[status]}</option>)}
      </select>
    </label>
    {selected !== null && <div>
      <button className="admin-secondary" onClick={() => setSelected(null)}>Close details</button>
      <RequestDetails key={selected} id={selected} isAdmin={isAdmin} onUpdated={onUpdated} />
    </div>}
    {visible.length === 0 && <p>{requests.length === 0 ? "No requests yet." : "No requests match this status."}</p>}
    <div className="admin-list">
      {visible.map(request => <article className="admin-item" key={request.id}>
        <div>
          <span className={`request-badge request-badge-${request.status}`}>{requestStatusLabels[request.status]}</span>
          <h3>#{request.id} · {request.subject}</h3>
          {isAdmin && <p>{request.customer_name} · {request.customer_email}</p>}
          <p className="admin-record-meta">{new Date(request.created_at).toLocaleString()}</p>
        </div>
        <button className="admin-secondary" aria-label={`View request ${request.id} details`}
          aria-expanded={selected === request.id} onClick={() => setSelected(request.id)}>View details</button>
      </article>)}
    </div>
  </>;
}
