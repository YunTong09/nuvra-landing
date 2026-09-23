export type Subscription = {
  id: number;
  client_id: number;
  tool_id: number;
  status: "active" | "cancelled";
  client_name: string;
  client_email: string;
  tool_title: string;
  created_at: string;
  updated_at: string;
};
