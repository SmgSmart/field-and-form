import { createContext, useContext } from "react";
import type { AdminState } from "@/lib/studio.types";

type AdminContextValue = {
  state: AdminState;
  reload: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) throw new Error("Desk data is not ready.");
  return value;
}
