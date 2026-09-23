export const requestStatuses = ["pending", "in_progress", "completed", "cancelled"] as const;
export type RequestStatus = typeof requestStatuses[number];
export const requestStatusLabels: Record<RequestStatus, string> = {
  pending: "Pending", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled",
};

export type RequestInput = { subject: string; message: string };
export type CustomerRequest = RequestInput & {
  id: number;
  user_id: number;
  customer_name: string;
  customer_email: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
};
