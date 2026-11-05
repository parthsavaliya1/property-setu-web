import { useProductSessionState } from "@/lib/product-session";
import { ExplorerContext, type ExplorerContextValue, type ProductSession } from "./session-store";
export type { ProductSession } from "./session-store";
import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ApiError } from "@/lib/propertysetu";
import {
  productRequest,
  type ExplorerLocation,
  type ExplorerView,
  type SearchFilters,
} from "@/lib/explorer";
import type { Me } from "@/lib/explorer-types";
export function useExplorer() {
  return useContext(ExplorerContext);
}
export function useProduct() {
  const value = useExplorer();
  if (!value) throw new Error("Explorer provider is missing");
  return value;
}
export function ExplorerProvider({
  location,
  navigate,
  children,
}: {
  location: ExplorerLocation;
  navigate: (location: ExplorerLocation) => void;
  children: ReactNode;
}) {
  const { session, setSession, ready } = useProductSessionState();
  const [me, setMe] = useState<Me | null>(null);
  const [authError, setAuthError] = useState("");
  const [message, setMessage] = useState("");
  const [refresh, setRefresh] = useState(0);
  const currentToken = useRef<string | null>(null);
  currentToken.current = session?.token || null;
  async function refreshMe() {
    const token = currentToken.current;
    if (!token) {
      setMe(null);
      return;
    }
    try {
      const next = await productRequest<Me>("/me", token);
      if (currentToken.current === token) {
        setMe(next);
        setAuthError("");
      }
    } catch (error) {
      if (currentToken.current !== token) return;
      if (error instanceof ApiError && error.status === 401) {
        signOut();
        setAuthError("Your session expired. Please sign in again.");
      } else setAuthError(error instanceof Error ? error.message : "Unable to load your profile.");
    }
  }
  useEffect(() => {
    void refreshMe();
  }, [session?.token, refresh]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 6000);
    return () => clearTimeout(timer);
  }, [message]);
  function signIn(next: ProductSession) {
    currentToken.current = next.token;
    const persisted = setSession(next);
    setMe(null);
    setAuthError("");
    if (!persisted) setMessage("Signed in for this tab. Browser storage is unavailable.");
  }

  function signOut() {
    currentToken.current = null;
    setSession(null);
    setMe(null);
  }

  const go = (view: ExplorerView, id?: string) => navigate({ view, ...(id ? { id } : {}) });
  const value: ExplorerContextValue = {
    location,
    go,
    search: (filters) => navigate({ view: "search", ...filters }),
    token: session?.token || null,
    session,
    me,
    ready,
    authError,
    refreshMe,
    signIn,
    signOut,
    requireLogin: () => {
      if (session) return true;
      navigate({ view: "login", next: location.view, ...(location.id ? { id: location.id } : {}) });
      return false;
    },
    notify: setMessage,
    refresh,
    changed: () => setRefresh((v) => v + 1),
  };
  return (
    <ExplorerContext.Provider value={value}>
      {children}
      {message && (
        <div className="xp-toast" role="status">
          {message}
          <button aria-label="Dismiss message" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
    </ExplorerContext.Provider>
  );
}
export function useResource<T>(path: string | null, token?: string | null, refresh = 0) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    setErrorStatus(null);
    if (!path) {
      setLoading(false);
      return;
    }
    setLoading(true);
    productRequest<T>(path, token)
      .then((next) => {
        if (active) setData(next);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load this page.");
          setErrorStatus(err instanceof ApiError ? err.status : null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, token, refresh, attempt]);
  return {
    data,
    loading,
    error,
    errorStatus,
    reload: () => setAttempt((v) => v + 1),
    retry: () => setAttempt((v) => v + 1),
  };
}
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  async function run(action: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The action failed. Please try again.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return { busy, error, setError, run };
}
