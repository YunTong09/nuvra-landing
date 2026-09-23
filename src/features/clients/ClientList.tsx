import type { Client } from "./types";

type Props = {
  clients: Client[];
  busy: boolean;
  onEdit: (record: Client) => void;
  onDelete: (record: Client) => void;
};

export function ClientList({ clients, busy, onEdit, onDelete }: Props) {
  return (
    <div
      className="admin-table-wrap"
      tabIndex={0}
      role="region"
      aria-label="Client records"
    >
      <table className="admin-table">
        <caption>Clients</caption>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Created (UTC)</th>
            <th>Updated (UTC)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>{client.id}</td>
              <td>{client.name}</td>
              <td>{client.email}</td>
              <td>
                <time dateTime={client.created_at}>
                  {client.created_at}
                </time>
              </td>
              <td>
                <time dateTime={client.updated_at}>
                  {client.updated_at}
                </time>
              </td>
              <td>
                <div className="admin-actions">
                  <button
                    className="admin-secondary"
                    disabled={busy}
                    onClick={() => onEdit(client)}
                    aria-label={`Edit ${client.name}`}
                  >
                    Edit
                  </button>
                  <button
                    className="admin-secondary admin-delete"
                    disabled={busy}
                    onClick={() => onDelete(client)}
                    aria-label={`Delete ${client.name}`}
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
