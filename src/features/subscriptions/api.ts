import { apiRequest } from "../../lib/http";
import { loadTools } from "../tools/api";
import type { Client } from "../clients/types";
import type { Tool } from "../tools/types";
import type { Subscription } from "./types";
import { listClients } from "../clients/api";

export const listSubscriptions = (query = ""): Promise<Subscription[]> => apiRequest(`subscriptions?${new URLSearchParams({ q: query })}`);
export const loadSubscriptionData = (query = ""): Promise<[Subscription[], Client[], Tool[]]> =>
  Promise.all([listSubscriptions(query), listClients(), loadTools()]);
export const saveSubscription = (
  id: number | null, input: Pick<Subscription, "client_id" | "tool_id" | "status">,
): Promise<Subscription> =>
  apiRequest(`subscriptions${id === null ? "" : `/${id}`}`, id === null ? "POST" : "PUT", input);
export const deleteSubscription = (id: number): Promise<null> => apiRequest(`subscriptions/${id}`, "DELETE");
