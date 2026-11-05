import { type ReactNode } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { Close, NavigateBefore, NavigateNext } from "@mui/icons-material";
import type { SnackbarMessage } from "notistack";
import { useHotkeys } from "react-hotkeys-hook";
import { hotkeyOptions } from "../../_helpers/hotkeys.helper";
import { testRunService } from "../../services";
import { TestRun } from "../../types";
import { CommentsPopper } from "../CommentsPopper";
import { StatusChip } from "../StatusChip";
import { TagLine } from "../TagLine";
import { Tooltip } from "../Tooltip";
import type { DialogEnqueue } from "./useDialogSnackbar";

const headerSx = {
  bgcolor: "background.default",
  px: 2,
  py: 1,
} as const;
const testRunNameSx = { fontWeight: 300, minWidth: 0 } as const;

const RunNavButton = ({
  label,
  hotkey,
  visible,
  onClick,
  icon,
}: {
  label: string;
  hotkey: string;
  visible: boolean;
  onClick: () => void;
  icon: ReactNode;
}) => (
  <Tooltip title={`Hotkey: ${hotkey}`}>
    <IconButton
      aria-label={label}
      color="secondary"
      size="small"
      style={{ visibility: visible ? "visible" : "hidden" }}
      onClick={onClick}
    >
      {icon}
    </IconButton>
  </Tooltip>
);

interface TestDetailsHeaderProps {
  testRun: TestRun;
  currentRunIndex: number;
  totalTestRunCount: number;
  noiseHint?: ReactNode;
  enqueueSnackbar: DialogEnqueue;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}

export const TestDetailsHeader = ({
  testRun,
  currentRunIndex,
  totalTestRunCount,
  noiseHint,
  enqueueSnackbar,
  onPrevious,
  onNext,
  onClose,
}: TestDetailsHeaderProps) => {
  const diff = Math.round(testRun.diffPercent * 100) / 100;
  const hasPrevious = currentRunIndex > 0;
  const hasNext = totalTestRunCount > currentRunIndex + 1;

  useHotkeys("right", onNext, hotkeyOptions, [currentRunIndex, onNext]);
  useHotkeys("left", onPrevious, hotkeyOptions, [currentRunIndex, onPrevious]);

  const saveComment = (comment: string) =>
    testRunService
      .update(testRun.id, { comment })
      .then(() => enqueueSnackbar("Comment updated", { variant: "success" }))
      .catch((err: SnackbarMessage) => {
        enqueueSnackbar(err, { variant: "error" });
        // still a failure, so the comment box stays open
        throw err;
      });

  return (
    <Box sx={headerSx}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Stack direction="row" sx={{ alignItems: "center" }}>
          <RunNavButton
            label="Previous run"
            hotkey="ArrowLeft"
            visible={hasPrevious}
            onClick={onPrevious}
            icon={<NavigateBefore />}
          />
          <Typography
            variant="body2"
            data-testid="step-position"
            sx={{ minWidth: "5ch", textAlign: "center" }}
          >{`${currentRunIndex + 1}/${totalTestRunCount}`}</Typography>
          <RunNavButton
            label="Next run"
            hotkey="ArrowRight"
            visible={hasNext}
            onClick={onNext}
            icon={<NavigateNext />}
          />
        </Stack>
        <Typography variant="h6" noWrap sx={testRunNameSx}>
          {testRun.name}
        </Typography>
        <StatusChip status={testRun.status} />
        <Tooltip
          title={`${diff}% of pixels differ; the allowed tolerance is ${testRun.diffTollerancePercent}%, set with diffTollerancePercent in the track method.`}
        >
          <Typography variant="caption" sx={{ fontWeight: "bold" }}>
            {`Diff ${diff}% · tol ${testRun.diffTollerancePercent}%`}
          </Typography>
        </Tooltip>
        {noiseHint}
        <Box sx={{ flexGrow: 1 }} />
        <CommentsPopper text={testRun.comment} onSave={saveComment} />
        <IconButton aria-label="Close" color="inherit" onClick={onClose}>
          <Close data-testid="CloseIcon" />
        </IconButton>
      </Stack>
      <Box sx={{ pl: 0.5 }}>
        <TagLine tags={testRun} />
      </Box>
    </Box>
  );
};
