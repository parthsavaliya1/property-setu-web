import { useEffect, useRef, useState } from "react";
import { productRequest } from "@/lib/explorer";
export function usePagedResource<T extends { id: string }>(
  path: string,
  token?: string | null,
  refresh = 0,
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMore, setErrorMore] = useState("");
  const generation = useRef(0);
  const nextOffset = useRef(0);
  const locked = useRef(false);
  const url = (offset: number) =>
    `${path}${path.includes("?") ? "&" : "?"}limit=50${offset ? `&offset=${offset}` : ""}`;
  useEffect(() => {
    const version = ++generation.current;
    setLoading(true);
    setData(null);
    setError("");
    setErrorMore("");
    setHasMore(false);
    nextOffset.current = 0;
    locked.current = false;
    setLoadingMore(false);
    productRequest<T[]>(url(0), token)
      .then((rows) => {
        if (version !== generation.current) return;
        const next = Array.isArray(rows) ? rows : [];
        setData(next);
        nextOffset.current = next.length;
        setHasMore(next.length === 50);
      })
      .catch((err) => {
        if (version === generation.current)
          setError(err instanceof Error ? err.message : "Unable to load properties.");
      })
      .finally(() => {
        if (version === generation.current) setLoading(false);
      });
    return () => {
      generation.current++;
    };
  }, [path, token, refresh, attempt]);
  async function loadMore() {
    if (locked.current || !hasMore || loading) return;
    locked.current = true;
    setLoadingMore(true);
    setErrorMore("");
    const version = generation.current;
    try {
      const rows = await productRequest<T[]>(url(nextOffset.current), token);
      if (version !== generation.current) return;
      nextOffset.current += rows.length;
      setData((previous) => {
        const ids = new Set(previous?.map((row) => row.id));
        return [...(previous || []), ...rows.filter((row) => !ids.has(row.id))];
      });
      setHasMore(rows.length === 50);
    } catch (err) {
      if (version === generation.current)
        setErrorMore(err instanceof Error ? err.message : "Unable to load more properties.");
    } finally {
      if (version === generation.current) {
        setLoadingMore(false);
        locked.current = false;
      }
    }
  }
  const reload = () => setAttempt((value) => value + 1);
  return { data, loading, error, retry: reload, reload, hasMore, loadingMore, errorMore, loadMore };
}
