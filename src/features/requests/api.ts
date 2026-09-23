import { apiRequest } from "../../lib/http";
import type { CustomerRequest, RequestInput, RequestStatus } from "../../../shared/requests";

export const listRequests = () => apiRequest<CustomerRequest[]>("requests");
export const getRequest = (id: number) => apiRequest<CustomerRequest>(`requests/${id}`);
export const submitRequest = (input: RequestInput) => apiRequest<CustomerRequest>("requests", "POST", input);
export const updateRequestStatus = (id: number, status: RequestStatus) =>
  apiRequest<CustomerRequest>(`requests/${id}/status`, "PUT", { status });
