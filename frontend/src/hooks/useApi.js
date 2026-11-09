import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

// Reads one GET path (null for none) as it changes. The last answer stays while
// the next loads, so a list doesn't flash empty between filters
export function useApi(path) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, payload: null, error: null });
  const key = path === null ? null : `${attempt}:${path}`;

  useEffect(() => {
    if (path === null) return undefined;
    // Answers can arrive out of order: only the latest request's is kept
    let latest = true;
    api(path).then(
      (payload) => latest && setResult({ key: `${attempt}:${path}`, payload, error: null }),
      (error) => latest && setResult((current) => ({ ...current, key: `${attempt}:${path}`, error })),
    );
    return () => {
      latest = false;
    };
  }, [path, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return {
    payload: result.payload,
    error: result.key === key ? result.error : null,
    loading: key !== null && result.key !== key,
    retry,
  };
}
