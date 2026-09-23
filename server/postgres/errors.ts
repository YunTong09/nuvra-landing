import type { ErrorRequestHandler } from "express";

export const handlePostgresError: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error?.code === "23505") return res.status(409).json({
    error: "That email or client–tool subscription already exists. Edit the existing record instead.",
  });
  if (error?.code === "23503") return res.status(409).json({
    error: "This record is linked to another table. Choose an existing client/tool, or remove its subscriptions before deleting it.",
  });
  if (error?.code === "23514") return res.status(400).json({ error: "Invalid subscription status." });
  const malformed = error instanceof SyntaxError;
  console.error("API error", error);
  res.status(malformed ? 400 : 500).json({
    error: malformed ? "Send valid JSON." : "Something went wrong. Please try again.",
  });
};
