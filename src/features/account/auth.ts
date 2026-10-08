import type { UserRole } from "../../../shared/roles";
import { apiRequest } from "../../lib/http";
import { ApiError } from "../../lib/api-response";

export type CurrentUser = { id: number; name: string; email: string; role: UserRole };
export function spacePath(user: CurrentUser | null) {
  return user ? user.role === "admin" ? "/admin" : user.role === "employee" ? "/employee" : "/dashboard" : "/login";
}

export async function currentUser() {
  try {
    const result = await apiRequest<{ user: CurrentUser }>("auth/me");
    return result.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
