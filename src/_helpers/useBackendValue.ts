import { useEffect, useState } from "react";

export function useBackendValue<T>(
  load: () => Promise<T>,
  fallback: T,
): T | undefined {
  const [value, setValue] = useState<T>();
  // the first fallback is kept: a new object each render would refetch
  const [initialFallback] = useState(fallback);

  useEffect(() => {
    let active = true;
    const update = (next: T) => {
      if (active) {
        setValue(next);
      }
    };
    load()
      .then(update)
      .catch(() => update(initialFallback));
    return () => {
      active = false;
    };
  }, [load, initialFallback]);

  return value;
}
