import { apiRequest } from "../../lib/http";
import type { CustomerRequest, RequestInput, RequestStatus, RequestFilters } from "../../../shared/requests";

export function listRequests(filters: RequestFilters = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value);
  }
  return apiRequest<CustomerRequest[]>(`requests?${query}`);
}
export const getRequest = (id: number) => apiRequest<CustomerRequest>(`requests/${id}`);
export const submitRequest = (input: RequestInput) => apiRequest<CustomerRequest>("requests", "POST", input);
export const updateRequestStatus = (id: number, status: RequestStatus) =>
  apiRequest<CustomerRequest>(`requests/${id}/status`, "PUT", { status });
