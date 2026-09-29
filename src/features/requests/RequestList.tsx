import { useState } from "react";
import { requestStatusLabels, type CustomerRequest } from "../../../shared/requests";
import { RequestDetails } from "./RequestDetails";

export function RequestList({ requests, canManageRequests, onUpdated }: {
  requests: CustomerRequest[]; canManageRequests: boolean; onUpdated: (request: CustomerRequest) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  return <>
    {selected !== null && <div>
      <button className="admin-secondary" onClick={() => setSelected(null)}>Close details</button>
      <RequestDetails key={selected} id={selected} canManageRequests={canManageRequests} onUpdated={onUpdated} />
    </div>}
    {requests.length === 0 && <p>No requests found. Try another search or clear the filters.</p>}
    <div className="admin-list">
      {requests.map(request => <article className="admin-item" key={request.id}>
        <div>
          <span className={`request-badge request-badge-${request.status}`}>{requestStatusLabels[request.status]}</span>
          <h3>#{request.id} · {request.subject}</h3>
          {canManageRequests && <p>{request.customer_name} · {request.customer_email}</p>}
          <p className="admin-record-meta">{new Date(request.created_at).toLocaleString()}</p>
        </div>
        <button className="admin-secondary" aria-label={`View request ${request.id} details`}
          aria-expanded={selected === request.id} onClick={() => setSelected(request.id)}>View details</button>
      </article>)}
    </div>
  </>;
}
