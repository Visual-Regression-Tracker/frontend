import type { ReactNode } from "react";
import {
  BlurOn,
  CloudDownload,
  DeleteOutlineOutlined,
  LayersClear,
  ThumbDown,
  ThumbUp,
} from "@mui/icons-material";
import type { BulkResult } from "../../services/testRun.service";
import type { NoiseAnalysisQueued, TestRun } from "../../types";
import { runLabel } from "../../_helpers/testRunTags.helper";
import { partialFailureText, pluralize } from "../../_helpers/format.helper";

export const testRuns = (count: number): string =>
  `${count} test ${pluralize(count, "run")}`;

export type BulkAction = "Approve" | "Reject" | "Download" | "Delete" | "Clear";

const PAST_TENSE: Record<BulkAction, string> = {
  Approve: "Approved",
  Reject: "Rejected",
  Delete: "Deleted",
  Download: "Downloaded",
  Clear: "Cleared",
};

export const isReview = (
  action: BulkAction | null,
): action is "Approve" | "Reject" =>
  action === "Approve" || action === "Reject";

export const ACTION_BUTTONS: {
  action: BulkAction;
  label: string;
  icon: ReactNode;
  color?: "error";
}[] = [
  { action: "Approve", label: "Approve", icon: <ThumbUp /> },
  { action: "Reject", label: "Reject", icon: <ThumbDown /> },
  { action: "Download", label: "Download zip", icon: <CloudDownload /> },
  { action: "Clear", label: "Clear ignore areas…", icon: <LayersClear /> },
  {
    action: "Delete",
    label: "Delete…",
    icon: <DeleteOutlineOutlined />,
    color: "error",
  },
];

export const ANALYSE_BUTTON = {
  label: "Analyse noise",
  icon: <BlurOn />,
};

export const analysedText = ({
  queued,
  skipped,
}: NoiseAnalysisQueued): string =>
  `Analysing ${testRuns(queued)}${
    skipped.length > 0 ? `, ${skipped.length} skipped` : ""
  }.`;

export const processedText = (
  verb: BulkAction,
  eligibleCount: number,
  selectedCount: number,
): string =>
  isReview(verb)
    ? `${testRuns(eligibleCount)} ${PAST_TENSE[verb].toLowerCase()}.`
    : `${testRuns(selectedCount)} processed.`;

export const partialText = (
  verb: BulkAction,
  result: BulkResult,
  rows: TestRun[],
): string =>
  partialFailureText(
    PAST_TENSE[verb],
    result,
    testRuns(result.succeeded.length + result.failed.length),
    (id) => {
      const row = rows.find((candidate) => candidate.id === id);
      return row && runLabel(row);
    },
  );
