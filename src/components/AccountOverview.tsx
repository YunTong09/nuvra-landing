import type { CurrentUser } from "../features/account/auth";

export function AccountOverview({ user }: { user: CurrentUser }) {
  return <section className="account-card" aria-labelledby="profile-heading">
    <h2 id="profile-heading">Your profile</h2>
    <dl className="account-summary">
      <div><dt>Name</dt><dd>{user.name}</dd></div>
      <div><dt>Email</dt><dd>{user.email}</dd></div>
    </dl>
    <div className="account-actions">
      <a className="admin-secondary" href="/account/edit">Edit profile</a>
      <a className="button" href="/requests/new">Submit a new request</a>
    </div>
  </section>;
}
