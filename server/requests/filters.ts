import { requestStatuses, type RequestFilters, type RequestStatus } from "../../shared/requests.ts";

// Accept only scalar query parameters and real calendar dates.
export function parseRequestFilters(query: Record<string, unknown>): RequestFilters {
  const filters: RequestFilters = {};
  for (const key of ["q", "status", "from", "to"] as const) {
    const value = query[key];
    if (value === undefined || value === "") continue;
    if (typeof value !== "string") throw new Error(`Invalid ${key} filter.`);
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (key === "q") {
      if (trimmed.length > 150) throw new Error("Keep search text within 150 characters.");
      filters.q = trimmed;
    } else if (key === "status") {
      if (!requestStatuses.includes(trimmed as RequestStatus)) throw new Error("Choose a valid request status.");
      filters.status = trimmed as RequestStatus;
    } else {
      const date = new Date(`${trimmed}T00:00:00.000Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || trimmed < "0001-01-01" || trimmed > "9998-12-31" ||
          !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== trimmed)
        throw new Error("Use valid dates in YYYY-MM-DD format.");
      filters[key] = trimmed;
    }
  }
  if (filters.from && filters.to && filters.from > filters.to)
    throw new Error("Start date must be on or before end date.");
  return filters;
}

// All user input is bound as parameters; ownership is combined with every filter.
export function requestWhere(filters: RequestFilters, userId: number | undefined, dialect: "sqlite" | "postgres") {
  const values: (string | number)[] = [];
  const clauses: string[] = [];
  const bind = (value: string | number) => {
    values.push(value);
    return dialect === "postgres" ? `$${values.length}` : "?";
  };
  if (userId !== undefined) clauses.push(`customer_requests.user_id = ${bind(userId)}`);
  if (filters.q) {
    const pattern = `%${filters.q.toLowerCase().replace(/[!%_]/g, "!$&")}%`;
    const columns = ["customer_requests.subject", "customer_requests.message", "CAST(customer_requests.id AS TEXT)"];
    if (userId === undefined) columns.push("users.name", "users.email");
    clauses.push("(" + columns.map(column => `LOWER(${column}) LIKE ${bind(pattern)} ESCAPE '!'`).join(" OR ") + ")");
  }
  if (filters.status) clauses.push(`customer_requests.status = ${bind(filters.status)}`);
  const dateClause = (operator: string, value: string) => {
    const parameter = bind(value);
    return dialect === "sqlite"
      ? `julianday(customer_requests.created_at) ${operator} julianday(${parameter})`
      : `customer_requests.created_at ${operator} ${parameter}::timestamptz`;
  };
  if (filters.from) clauses.push(dateClause(">=", `${filters.from}T00:00:00.000Z`));
  if (filters.to) {
    const nextDay = new Date(`${filters.to}T00:00:00.000Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    clauses.push(dateClause("<", nextDay.toISOString()));
  }
  return { where: clauses.length ? " WHERE " + clauses.join(" AND ") : "", values };
}
