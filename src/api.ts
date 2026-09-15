// Development uses the local Vite proxy; production uses same-origin Vercel Functions.
export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export type Tool = {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export async function loadTools(): Promise<Tool[]> {
  const response = await fetch(`${API_URL}/api/tools`, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load tools. Please try again.");
  return response.json();
}

export type Client = {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
};
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

// Shared JSON handling for the two new admin tables.
export async function adminRequest(
  path: string,
  method = "GET",
  body?: object,
) {
  const response = await fetch(`${API_URL}/api/${path}`, {
    method,
    cache: "no-store",
    headers: { "Content-Type": "application/json", "X-Nuvra-Request": "1" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 204) return null;
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "The request failed. Please try again.");
  return result;
}
