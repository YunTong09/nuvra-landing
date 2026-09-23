import { useEffect, useRef, type FormEvent } from "react";
import type { Client } from "./types";

type Props = {
  editing: Client | null;
  busy: boolean;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export function ClientForm({ editing, busy, onSave, onCancel }: Props) {
  const firstInput = useRef<HTMLInputElement>(null);
  useEffect(() => { firstInput.current?.focus(); }, []);

  return (
    <form
      className="contact-form admin-form"
      onSubmit={onSave}
    >
      <h2>{editing ? "Edit client" : "Add client"}</h2>
      <fieldset className="contact-fields" disabled={busy}>
        <label htmlFor="client-name">
          Client name
          <input
            ref={firstInput}
            id="client-name"
            name="name"
            defaultValue={editing?.name ?? ""}
            required
            maxLength={100}
          />
        </label>
        <label htmlFor="client-email">
          Email
          <input
            id="client-email"
            name="email"
            type="email"
            defaultValue={editing?.email ?? ""}
            required
            maxLength={254}
          />
        </label>
      </fieldset>
      <div className="admin-actions">
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : "Save Client"}
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
