import { useEffect, useState } from "react";
import { currentUser, type CurrentUser } from "./auth";

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    currentUser().then(found => { if (active) setUser(found); });
    return () => { active = false; };
  }, []);
  return user;
}
