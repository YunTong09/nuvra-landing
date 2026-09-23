// Development uses the local Vite proxy; production uses same-origin Vercel Functions.
export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export async function apiRequest<T>(path: string, method = "GET", body?: object): Promise<T> {
  const response = await fetch(`${API_URL}/api/${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", "X-Nuvra-Request": "1" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 204) return null as T;
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Please try again.");
  return result as T;
}

