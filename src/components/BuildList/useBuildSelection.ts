import { useLayoutEffect, useState } from "react";
import { useSnackbar } from "notistack";
import { buildsService } from "../../services";
import { useRequestGuard } from "../../_helpers/staleGuard";
import type { Build } from "../../types";

export function useBuildSelection({
  buildList,
  total,
  selectedProjectId,
  searchQuery,
  refreshes,
  lastDeletedId,
}: {
  buildList: Build[];
  total: number;
  selectedProjectId: string | null;
  searchQuery: string;
  refreshes: number;
  lastDeletedId: string | undefined;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectingAll, setSelectingAll] = useState(false);
  const selectAllGuard = useRequestGuard();

  const [seenRefresh, setSeenRefresh] = useState(refreshes);
  if (seenRefresh !== refreshes) {
    setSeenRefresh(refreshes);
    setSelectedIds((prev) => prev.filter((id) => id !== lastDeletedId));
  }

  const allSelected = total > 0 && selectedIds.length === total;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const clearSelection = () => setSelectedIds([]);

  const selectAllMatching = () => {
    if (buildList.length === total) {
      setSelectedIds(buildList.map((build) => build.id));
      return;
    }
    if (!selectedProjectId) {
      return;
    }

    const isCurrent = selectAllGuard.start();
    setSelectingAll(true);
    buildsService
      .getList(selectedProjectId, total, 0, searchQuery)
      .then((payload) => {
        if (isCurrent()) {
          setSelectedIds(payload.data.map((build) => build.id));
        }
      })
      .catch((err: string) => enqueueSnackbar(err, { variant: "error" }))
      .finally(() => setSelectingAll(false));
  };

  const toggleSelectAll = () =>
    selectedIds.length > 0 ? clearSelection() : selectAllMatching();

  const selectAllLabel =
    selectedIds.length > 0 ? "Clear selection" : `Select all (${total})`;

  // in the commit that cleared the selection, so an in-flight select all cannot land on another search
  useLayoutEffect(() => {
    selectAllGuard.invalidate();
  }, [selectAllGuard, selectedProjectId, searchQuery]);

  return {
    selectedIds,
    setSelectedIds,
    selectingAll,
    allSelected,
    someSelected,
    toggleSelect,
    clearSelection,
    selectAllMatching,
    toggleSelectAll,
    selectAllLabel,
  };
}
