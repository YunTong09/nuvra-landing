import { useEffect, useRef, type FormEvent } from "react";
import type { Subscription } from "./types";
import type { Client } from "../clients/types";
import type { Tool } from "../tools/types";

type Props = {
  editing: Subscription | null;
  busy: boolean;
  clients: Client[];
  tools: Tool[];
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export function SubscriptionForm({ editing, busy, onSave, onCancel, clients, tools }: Props) {
  const firstInput = useRef<HTMLSelectElement>(null);
  useEffect(() => { firstInput.current?.focus(); }, []);

  return (
    <form
      className="contact-form admin-form"
      onSubmit={onSave}
    >
      <h2>{editing ? "Edit subscription" : "Add subscription"}</h2>
      <fieldset className="contact-fields" disabled={busy}>
        <label htmlFor="subscription-client">
          Client
          <select
            ref={firstInput}
            id="subscription-client"
            name="client_id"
            defaultValue={editing?.client_id ?? ""}
            required
          >
            <option value="" disabled>
              Choose a client
            </option>
            {clients.map((client) => (
              <option value={client.id} key={client.id}>
                {client.name} — {client.email} (#{client.id})
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="subscription-tool">
          Tool
          <select
            id="subscription-tool"
            name="tool_id"
            defaultValue={editing?.tool_id ?? ""}
            required
          >
            <option value="" disabled>
              Choose a tool
            </option>
            {tools.map((tool) => (
              <option value={tool.id} key={tool.id}>
                {tool.title} (#{tool.id})
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="subscription-status">
          Status
          <select
            id="subscription-status"
            name="status"
            defaultValue={editing?.status ?? "active"}
          >
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </fieldset>
      <div className="admin-actions">
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : "Save Subscription"}
        </button>
        <button
          type="button"
          className="admin-cancel"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
