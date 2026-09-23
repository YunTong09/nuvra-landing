import type { CustomerRequest, RequestInput, RequestStatus } from "../../shared/requests.ts";

// Both databases implement the same operations; routes own validation and access rules.
export interface RequestRepository {
  list(userId?: number): Promise<CustomerRequest[]>;
  find(id: number, userId?: number): Promise<CustomerRequest | undefined>;
  create(userId: number, input: RequestInput): Promise<CustomerRequest>;
  updateStatus(id: number, status: RequestStatus): Promise<CustomerRequest | undefined>;
}

export const requestSelect = `SELECT customer_requests.*, users.name AS customer_name,
  users.email AS customer_email FROM customer_requests
  JOIN users ON users.id = customer_requests.user_id`;
