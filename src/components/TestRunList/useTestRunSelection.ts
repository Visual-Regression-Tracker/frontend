import { useCallback, useState } from "react";

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
  const [selectedFor, setSelectedFor] = useState(buildId);
  if (selectedFor !== buildId) {
    setSelectedFor(buildId);
    setSelectedIds([]);
  }

  const toggleOne = useCallback(
    (id: string) =>
      setSelectedIds((prev) =>
        prev.includes(id)
          ? prev.filter((other) => other !== id)
          : [...prev, id],
      ),
    [],
  );

  return { selectedIds, setSelectedIds, toggleAll, toggleOne };
};
