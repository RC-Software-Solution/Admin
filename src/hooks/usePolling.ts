import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Calls `fetcher` now and every `intervalMs`, skipping ticks while the tab is hidden and
 * refetching when it becomes visible again. Keeps the last good `data` if a refresh fails.
 */
export function usePolling<T>(fetcher: (signal: AbortSignal) => Promise<T>, intervalMs = 30_000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const abort = useRef<AbortController | null>(null);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const refresh = useCallback(async () => {
    abort.current?.abort(); // a newer request supersedes one still in flight
    const ctrl = (abort.current = new AbortController());
    try {
      const next = await fetcherRef.current(ctrl.signal);
      setData(next);
      setUpdatedAt(new Date());
      setError("");
    } catch (e) {
      if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Refresh failed");
    }
  }, []);

  useEffect(() => {
    refresh();
    const tick = setInterval(() => !document.hidden && refresh(), intervalMs);
    const onVisible = () => !document.hidden && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
      abort.current?.abort();
    };
  }, [refresh, intervalMs]);

  return { data, error, updatedAt, refresh };
}
