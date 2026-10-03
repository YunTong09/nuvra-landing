import { readApiResponse } from "./api-response";

// Development uses the local Vite proxy; production uses same-origin Vercel Functions.
export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export async function apiRequest<T>(path: string, method = "GET", body?: object): Promise<T> {
  const multipart = body instanceof FormData;
  const response = await fetch(`${API_URL}/api/${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: { ...(!multipart ? { "Content-Type": "application/json" } : {}), "X-Nuvra-Request": "1" },
    ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}),
  });
  return readApiResponse<T>(response);
}
