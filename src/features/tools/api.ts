import { apiRequest } from "../../lib/http";
import type { Tool } from "./types";

export const loadTools = (query = ""): Promise<Tool[]> => apiRequest(`tools?${new URLSearchParams({ q: query })}`);
export const saveTool = (id: number | null, input: Pick<Tool, "title" | "description">) =>
  apiRequest<Tool>(`tools${id === null ? "" : `/${id}`}`, id === null ? "POST" : "PUT", input);
export const deleteTool = (id: number) => apiRequest<null>(`tools/${id}`, "DELETE");
