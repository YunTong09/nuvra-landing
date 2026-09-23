import { Router, type Express } from "express";
import { requestStatuses, type RequestStatus } from "../../shared/requests.ts";
import type { RequestRepository } from "./repository.ts";

export function registerRequests(app: Express, repository: RequestRepository) {
  const router = Router();
  // Authentication middleware must run before these routes.
  router.use((_req, res, next) => {
    if (!res.locals.user) return res.status(401).json({ error: "Please log in." });
    next();
  });
  router.param("id", (_req, res, next, value) => {
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1)
      return res.status(400).json({ error: "Invalid request ID." });
    next();
  });
  router.get("/", async (_req, res) => {
    const user = res.locals.user;
    res.json(await repository.list(user.role === "admin" ? undefined : user.id));
  });
  router.post("/", async (req, res) => {
    const { subject, message } = req.body ?? {};
    if (typeof subject !== "string" || !subject.trim() || subject.trim().length > 150)
      return res.status(400).json({ error: "Enter a subject of 1–150 characters." });
    if (typeof message !== "string" || !message.trim() || message.trim().length > 5000)
      return res.status(400).json({ error: "Enter request details of 1–5000 characters." });
    // Ownership and initial status are assigned by the server, never by the customer.
    res.status(201).json(await repository.create(res.locals.user.id,
      { subject: subject.trim(), message: message.trim() }));
  });
  router.get("/:id", async (req, res) => {
    const user = res.locals.user;
    const record = await repository.find(Number(req.params.id), user.role === "admin" ? undefined : user.id);
    if (!record) return res.status(404).json({ error: "Request not found." });
    res.json(record);
  });
  router.put("/:id/status", async (req, res) => {
    if (res.locals.user.role !== "admin")
      return res.status(403).json({ error: "Administrator access required." });
    const status = req.body?.status;
    if (!requestStatuses.includes(status))
      return res.status(400).json({ error: "Choose a valid request status." });
    const record = await repository.updateStatus(Number(req.params.id), status as RequestStatus);
    if (!record) return res.status(404).json({ error: "Request not found." });
    res.json(record);
  });
  app.use("/api/requests", router);
}
