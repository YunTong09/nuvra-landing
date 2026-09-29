import { useState, type FormEvent } from "react";

type Props = { label: string; placeholder: string; disabled?: boolean; onSearch: (query: string) => void };

export function SearchBar({ label, placeholder, disabled, onSearch }: Props) {
  const [query, setQuery] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(query.trim());
  }
  return <form className="admin-search" role="search" aria-label={label} onSubmit={submit}>
    <label>{label}
      <input type="search" value={query} maxLength={150} placeholder={placeholder}
        disabled={disabled} onChange={event => setQuery(event.target.value)} />
    </label>
    <button className="button" disabled={disabled}>Search</button>
    <button className="admin-secondary" type="button" disabled={disabled}
      onClick={() => { setQuery(""); onSearch(""); }}>Clear search</button>
  </form>;
}
