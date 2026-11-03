import { useCallback, useEffect, useState } from "react";

export const useTestRunSelection = (buildId: string | undefined) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // every filtered run, not just the page: the table's header box does the same
  const toggleAll = useCallback(
    (ids: string[]) =>
      setSelectedIds((prev) => {
        const previous = new Set(prev);
        return ids.every((id) => previous.has(id)) ? [] : ids;
      }),
    [],
  );

  // the list stays mounted across builds, so ticks must not carry over
  useEffect(() => {
    setSelectedIds([]);
  }, [buildId]);

  const toggleGroup = useCallback(
    (ids: string[]) =>
      setSelectedIds((prev) => {
        const previous = new Set(prev);
        if (ids.every((id) => previous.has(id))) {
          const dropped = new Set(ids);
          return prev.filter((id) => !dropped.has(id));
        }
        return Array.from(new Set([...prev, ...ids]));
      }),
    [],
  );

  return { selectedIds, setSelectedIds, toggleAll, toggleGroup };
};
