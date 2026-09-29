import type { UserRole } from "../../../shared/roles";
import { apiRequest } from "../../lib/http";

export type CurrentUser = { id: number; name: string; email: string; role: UserRole };
export function spacePath(user: CurrentUser | null) {
  return user ? user.role === "admin" ? "/admin" : user.role === "employee" ? "/employee" : "/dashboard" : "/login";
}

export async function currentUser() {
  try {
    const result = await apiRequest<{ user: CurrentUser }>("auth/me");
    return result.user;
  } catch {
    return null;
  }
}
