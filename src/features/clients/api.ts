import { apiRequest } from "../../lib/http";
import type { Client } from "./types";

export const listClients = (query = ""): Promise<Client[]> => apiRequest(`clients?${new URLSearchParams({ q: query })}`);
export const saveClient = (id: number | null, input: Pick<Client, "name" | "email">): Promise<Client> =>
  apiRequest(`clients${id === null ? "" : `/${id}`}`, id === null ? "POST" : "PUT", input);
export const deleteClient = (id: number): Promise<null> => apiRequest(`clients/${id}`, "DELETE");
