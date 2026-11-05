import { createContext } from "react";
import type { ExplorerLocation, ExplorerView, SearchFilters } from "@/lib/explorer";
import type { Me } from "@/lib/explorer-types";
export type ProductSession = {
  token: string;
  user: { id: string; phone?: string | null; email?: string | null };
};
export type ExplorerContextValue = {
  location: ExplorerLocation;
  go: (view: ExplorerView, id?: string) => void;
  search: (filters: SearchFilters) => void;
  token: string | null;
  session: ProductSession | null;
  me: Me | null;
  ready: boolean;
  authError: string;
  refreshMe: () => Promise<void>;
  signIn: (session: ProductSession) => void;
  signOut: () => void;
  requireLogin: () => boolean;
  notify: (message: string) => void;
  refresh: number;
  changed: () => void;
};
export const ExplorerContext = createContext<ExplorerContextValue | null>(null);
