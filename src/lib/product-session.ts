import { useEffect, useState } from "react";
import type { ProductSession } from "@/components/propertysetu/explorer/session-store";

export const PRODUCT_SESSION_KEY = "propertysetu_web_session";
const sessionEvent = "propertysetu:customer-session";
let volatileSession: ProductSession | null | undefined;

function readSession(): ProductSession | null {
  if (volatileSession !== undefined) return volatileSession;
  try {
    const parsed = JSON.parse(localStorage.getItem(PRODUCT_SESSION_KEY) || "null");
    return typeof parsed?.token === "string" &&
      parsed.token &&
      typeof parsed?.user?.id === "string" &&
      parsed.user.id
      ? parsed
      : null;
  } catch {
    return null;
  }
}

// Shared by the public website and Explore; administrator authentication stays separate.
export function saveProductSession(session: ProductSession | null): boolean {
  let persisted = true;
  try {
    if (session) localStorage.setItem(PRODUCT_SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(PRODUCT_SESSION_KEY);
    volatileSession = undefined;
  } catch {
    volatileSession = session;
    persisted = false;
  }
  window.dispatchEvent(new Event(sessionEvent));
  return persisted;
}

export function useProductSessionState() {
  const [session, setSessionState] = useState<ProductSession | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => {
      setSessionState(readSession());
      setReady(true);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === PRODUCT_SESSION_KEY || event.key === null) sync();
    };
    sync();
    window.addEventListener(sessionEvent, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(sessionEvent, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  const setSession = (next: ProductSession | null) => {
    setSessionState(next);
    return saveProductSession(next);
  };
  return { session, ready, setSession };
}
