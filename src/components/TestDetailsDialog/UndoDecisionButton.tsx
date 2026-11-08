import { useState } from "react";
import { Button } from "@mui/material";
import { Undo } from "@mui/icons-material";
import { ReviewDecision } from "../../services";
import { TestRun, TestStatus } from "../../types";
import { revertDecision } from "../UndoSnackbarAction";
import { useDialogSnackbar } from "./useDialogSnackbar";

const DECISIONS: Partial<
  Record<TestStatus, { decision: ReviewDecision; label: string }>
> = {
  [TestStatus.approved]: { decision: "approve", label: "Undo approval" },
  [TestStatus.failed]: { decision: "reject", label: "Undo rejection" },
};

export const UndoDecisionButton = ({ testRun }: { testRun: TestRun }) => {
  const { enqueueSnackbar } = useDialogSnackbar();
  const [undoing, setUndoing] = useState(false);
  const undoable = DECISIONS[testRun.status];

  if (!undoable) {
    return null;
  }

  const undo = () => {
    setUndoing(true);
    void revertDecision({
      ids: [testRun.id],
      decision: undoable.decision,
      undoneText: "Undone",
      enqueueSnackbar,
    }).finally(() => setUndoing(false));
  };

  return (
    <Button
      size="small"
      startIcon={<Undo />}
      disabled={undoing}
      onClick={undo}
      sx={{ textTransform: "none" }}
    >
      {undoable.label}
    </Button>
  );
};
