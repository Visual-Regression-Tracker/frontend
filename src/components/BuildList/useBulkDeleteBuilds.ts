import { useState } from "react";
import { useSnackbar } from "notistack";
import { deleteBuild, useBuildDispatch } from "../../contexts";

export function useBulkDeleteBuilds({
  selectedIds,
  selectedBuildId,
  clearSelection,
  closeDialog,
  onDone,
  openAfterDelete,
}: {
  selectedIds: string[];
  selectedBuildId: string | undefined;
  clearSelection: () => void;
  closeDialog: () => void;
  onDone: (deletedCount: number) => void;
  openAfterDelete: () => void;
}) {
  const buildDispatch = useBuildDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handleBulkDelete = () => {
    if (bulkDeleting) {
      return;
    }
    setBulkDeleting(true);
    closeDialog();
    const ids = [...selectedIds];

    void Promise.all(
      ids.map((id) =>
        deleteBuild(buildDispatch, id)
          .then(() => ({ id, ok: true }))
          .catch(() => ({ id, ok: false })),
      ),
    ).then((results) => {
      const deleted = results.filter((r) => r.ok);
      const failed = results.filter((r) => !r.ok);

      if (deleted.length > 0) {
        enqueueSnackbar(`${deleted.length} build(s) deleted`, {
          variant: "success",
        });
      }
      if (failed.length > 0) {
        enqueueSnackbar(`Failed to delete ${failed.length} build(s)`, {
          variant: "error",
        });
      }
      if (deleted.some((r) => r.id === selectedBuildId)) {
        openAfterDelete();
      }

      setBulkDeleting(false);
      clearSelection();

      onDone(deleted.length);
    });
  };

  return { bulkDeleting, handleBulkDelete };
}
