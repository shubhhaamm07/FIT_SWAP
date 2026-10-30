import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useFeedback } from "../contexts/FeedbackContext";
import { onResourcesInvalidated } from "../utils/resource-events";

export function useResource<T>(path: string) {
  const { call, demo, user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const focused = useIsFocused();
  const previousPath = useRef(path);
  useEffect(() => {
    if (!focused || demo) return;
    const timer = setInterval(() => {
      if (AppState.currentState === "active") setRevision((v) => v + 1);
    }, 30000);
    const off = onResourcesInvalidated(() => setRevision((v) => v + 1));
    return () => {
      clearInterval(timer);
      off();
    };
  }, [focused, demo]);
  useEffect(() => {
    if (!focused) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    if (previousPath.current !== path) setData(null);
    previousPath.current = path;
    call<T>(path, { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // call is bound to the current auth state; other provider rerenders do not require a refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, revision, focused, demo, user?.id]);
  return {
    data,
    loading,
    error,
    reload: useCallback(() => setRevision((v) => v + 1), []),
  };
}
export function useAction() {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const { notify } = useFeedback();
  async function run(action: () => Promise<unknown>, success?: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await action();
      if (success) notify(success);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { busy, run };
}

export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
