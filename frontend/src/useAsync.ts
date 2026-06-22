import { useCallback, useEffect, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Run an async function on mount; expose data/loading/error + a reload(). */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    run()
      .then((d) => active && setData(d))
      .catch(
        (e: unknown) =>
          active && setError(e instanceof Error ? e.message : String(e)),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [run]);

  useEffect(() => load(), [load]);

  return { data, loading, error, reload: load };
}
