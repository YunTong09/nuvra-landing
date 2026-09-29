import type { RequestHandler } from "express";

export const validateSearch: RequestHandler = (req, res, next) => {
  const q = req.query.q;
  if (q !== undefined && (typeof q !== "string" || q.trim().length > 150))
    return res.status(400).json({ error: "Search must be text of at most 150 characters." });
  res.locals.search = typeof q === "string" ? q.trim() : "";
  next();
};

// Columns come from route code; user text is always passed as a bound value.
export function searchWhere(q: string, columns: string[], dialect: "sqlite" | "postgres") {
  if (!q) return { where: "", values: [] as string[] };
  const pattern = `%${q.toLowerCase().replace(/[!%_]/g, "!$&")}%`;
  const conditions = columns.map((column, index) =>
    `LOWER(${column}) LIKE ${dialect === "sqlite" ? "?" : `$${index + 1}`} ESCAPE '!'`);
  return { where: " WHERE (" + conditions.join(" OR ") + ")", values: columns.map(() => pattern) };
}
