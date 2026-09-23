import { apiRequest } from "../../lib/http";

export type CurrentUser = { id: number; name: string; email: string; role: "user" | "admin" };
export function spacePath(user: CurrentUser | null) {
  return user ? user.role === "admin" ? "/admin" : "/dashboard" : "/login";
}

export async function currentUser() {
  try {
    const result = await apiRequest<{ user: CurrentUser }>("auth/me");
    return result.user;
  } catch {
    return null;
  }
}
