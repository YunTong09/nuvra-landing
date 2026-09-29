export type UserRole = "user" | "employee" | "admin";

export function canManageRequests(role: unknown): boolean {
  return role === "admin" || role === "employee";
}
