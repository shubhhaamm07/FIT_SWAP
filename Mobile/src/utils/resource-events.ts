const subscribers = new Set<() => void>();
export function invalidateResources() {
  subscribers.forEach((fn) => fn());
}
export function onResourcesInvalidated(fn: () => void) {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}
