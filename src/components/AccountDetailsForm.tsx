import { useState, type FormEvent } from "react";
import { apiRequest, type CurrentUser } from "../auth";

type Props = {
  user: CurrentUser;
  onSaved: (user: CurrentUser) => void;
};

export function AccountDetailsForm({ user, onSaved }: Props) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest<{ user: CurrentUser }>("auth/me", "PUT", { name, email });
      onSaved(result.user);
      setName(result.user.name);
      setEmail(result.user.email);
      setNotice("Account details updated.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not update your account.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="account-card account-form" onSubmit={save}>
    <h2>Account details</h2>
    <label htmlFor="account-name">Name</label>
    <input id="account-name" value={name} onChange={event => setName(event.target.value)}
      required maxLength={100} />
    <label htmlFor="account-email">Email</label>
    <input id="account-email" type="email" value={email}
      onChange={event => setEmail(event.target.value)} required maxLength={254} />
    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="account-notice" role="status">{notice}</p>}
    <button className="button" type="submit" disabled={busy}>
      {busy ? "Saving…" : "Save changes"}
    </button>
  </form>;
}
