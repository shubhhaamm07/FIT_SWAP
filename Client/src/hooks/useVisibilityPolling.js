import { useEffect, useRef } from "react";

export const isRequestCancelled = (error) => (
  error?.code === "ERR_CANCELED"
  || error?.name === "CanceledError"
  || error?.name === "AbortError"
);

// Background work is paused in hidden tabs. Requests receive an AbortSignal
// and failed refreshes back off rather than repeatedly hitting the API.
export function useVisibilityPolling(task, {
  enabled = true,
  interval = 30_000,
  maxInterval = 5 * 60_000,
} = {}) {
  const taskRef = useRef(task);

  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return undefined;

    let disposed = false;
    let inFlight = false;
    let failures = 0;
    let timer = null;
    let controller = null;

    const clearScheduledRun = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
    };

    const schedule = (delay) => {
      clearScheduledRun();
      if (disposed || document.visibilityState === "hidden") return;
      timer = window.setTimeout(() => {
        timer = null;
        void run();
      }, delay);
    };

    const run = async () => {
      if (disposed || inFlight || document.visibilityState === "hidden") return;
      inFlight = true;
      controller = new AbortController();
      try {
        await taskRef.current({ signal: controller.signal });
        failures = 0;
        schedule(interval);
      } catch (error) {
        if (!isRequestCancelled(error)) {
          failures += 1;
          schedule(Math.min(interval * (2 ** failures), maxInterval));
        }
      } finally {
        inFlight = false;
        controller = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        clearScheduledRun();
        controller?.abort();
        return;
      }
      failures = 0;
      void run();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    void run();

    return () => {
      disposed = true;
      clearScheduledRun();
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, interval, maxInterval]);
}
