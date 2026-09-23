import { useState } from "react";
import type { CustomerRequest } from "../../../shared/requests";
import { RequestForm } from "./RequestForm";
import "./requests.css";

export function NewRequestPage() {
  const [submitted, setSubmitted] = useState<CustomerRequest | null>(null);

  if (submitted) return <section className="account-card" aria-labelledby="request-submitted-title">
    <h2 id="request-submitted-title">Request submitted</h2>
    <p role="status">Your request #{submitted.id} has been received and is Pending review.</p>
    <p>You can follow its progress in My requests on your dashboard.</p>
    <a className="button" href="/dashboard">View my requests</a>
  </section>;

  return <>
    <RequestForm onSubmitted={setSubmitted} />
    <a className="admin-secondary" href="/dashboard">Cancel and return to dashboard</a>
  </>;
}
