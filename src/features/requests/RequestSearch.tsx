import { useState, type FormEvent } from "react";
import { requestStatuses, requestStatusLabels, type RequestFilters, type RequestStatus } from "../../../shared/requests";

type Props = { canManageRequests: boolean; onSearch: (filters: RequestFilters) => void };

export function RequestSearch({ canManageRequests, onSearch }: Props) {
  const [q, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (from && to && from > to) {
      setError("Start date must be on or before end date.");
      return;
    }
    setError("");
    onSearch({ q: q.trim(), status: status ? status as RequestStatus : undefined, from, to });
  }

  function reset() {
    setQuery(""); setStatus(""); setFrom(""); setTo(""); setError("");
    onSearch({});
  }

  return <form className="request-search" role="search" aria-label="Search requests" onSubmit={search}>
    <label className="request-search-query" htmlFor="request-query">Search requests
      <input id="request-query" type="search" maxLength={150} value={q} onChange={event => setQuery(event.target.value)}
        placeholder={canManageRequests ? "Subject, details, ID, customer name or email" : "Subject, details or request ID"} />
    </label>
    <div className="request-search-filters">
      <label htmlFor="request-filter-status">Status
        <select id="request-filter-status" value={status} onChange={event => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {requestStatuses.map(value => <option key={value} value={value}>{requestStatusLabels[value]}</option>)}
        </select>
      </label>
      <label htmlFor="request-filter-from">Submitted from (UTC)
        <input id="request-filter-from" type="date" min="0001-01-01" max={to || "9998-12-31"} value={from} onChange={event => setFrom(event.target.value)} />
      </label>
      <label htmlFor="request-filter-to">Submitted through (UTC)
        <input id="request-filter-to" type="date" min={from || "0001-01-01"} max="9998-12-31" value={to} onChange={event => setTo(event.target.value)} />
      </label>
    </div>
    <div className="admin-actions">
      <button className="button" type="submit">Search</button>
      <button className="admin-secondary" type="button" onClick={reset}>Clear filters</button>
    </div>
    {error && <p className="auth-error" role="alert">{error}</p>}
  </form>;
}
