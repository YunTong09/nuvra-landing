import type { Subscription } from "./types";

type Props = {
  subscriptions: Subscription[];
  busy: boolean;
  onEdit: (record: Subscription) => void;
  onDelete: (record: Subscription) => void;
};

export function SubscriptionList({ subscriptions, busy, onEdit, onDelete }: Props) {
  return (
    <div
      className="admin-table-wrap"
      tabIndex={0}
      role="region"
      aria-label="Subscription records"
    >
      <table className="admin-table">
        <caption>Subscriptions</caption>
        <thead>
          <tr>
            <th>ID</th>
            <th>Client</th>
            <th>Tool</th>
            <th>Status</th>
            <th>Created (UTC)</th>
            <th>Updated (UTC)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((record) => (
            <tr key={record.id}>
              <td>{record.id}</td>
              <td>
                {record.client_name}
                <small>
                  {record.client_email} · #{record.client_id}
                </small>
              </td>
              <td>
                {record.tool_title}
                <small>#{record.tool_id}</small>
              </td>
              <td>{record.status}</td>
              <td>
                <time dateTime={record.created_at}>
                  {record.created_at}
                </time>
              </td>
              <td>
                <time dateTime={record.updated_at}>
                  {record.updated_at}
                </time>
              </td>
              <td>
                <div className="admin-actions">
                  <button
                    className="admin-secondary"
                    disabled={busy}
                    onClick={() => onEdit(record)}
                    aria-label={`Edit subscription ${record.id}`}
                  >
                    Edit
                  </button>
                  <button
                    className="admin-secondary admin-delete"
                    disabled={busy}
                    onClick={() => onDelete(record)}
                    aria-label={`Delete subscription ${record.id}`}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
