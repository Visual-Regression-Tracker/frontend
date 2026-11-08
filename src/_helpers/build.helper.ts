import type { Build } from "../types";
import { BuildStatus } from "../types/buildStatus";
import { pluralize } from "./format.helper";
import { statusLabelInline } from "./statusLabel.helper";

const MINUTE = 60_000;

export const hasLaterRun = ({
  createdAt,
  updatedAt,
}: Pick<Build, "createdAt" | "updatedAt">): boolean =>
  !!updatedAt && Date.parse(updatedAt) - Date.parse(createdAt) > MINUTE;

const runCountOf = (
  build: Pick<Build, "unresolvedCount" | "failedCount" | "passedCount">,
): number => build.unresolvedCount + build.failedCount + build.passedCount;

export const buildSummary = (
  build: Pick<
    Build,
    "status" | "isRunning" | "unresolvedCount" | "failedCount" | "passedCount"
  >,
): string => {
  if (build.isRunning) {
    return "running";
  }
  const runs = runCountOf(build);
  const count = `${runs} ${pluralize(runs, "run")}`;
  if (build.status === BuildStatus.unresolved) {
    return `${count} · ${build.unresolvedCount} unresolved`;
  }
  if (build.status === BuildStatus.failed) {
    return `${count} · ${build.failedCount} failed`;
  }
  return `${count} · ${statusLabelInline(build.status)}`;
};
