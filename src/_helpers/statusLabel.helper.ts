import { TestStatus } from "../types";
import { BuildStatus } from "../types/buildStatus";

const LABELS: Record<string, string> = {
  [TestStatus.new]: "New",
  [TestStatus.ok]: "Passed",
  [TestStatus.unresolved]: "Unresolved",
  [TestStatus.failed]: "Failed",
  [TestStatus.approved]: "Approved",
  [TestStatus.autoApproved]: "Auto-approved",
  [BuildStatus.passed]: "Passed",
} satisfies Record<TestStatus | BuildStatus, string>;

export const statusLabel = (status: string | undefined): string =>
  status === undefined ? "" : (LABELS[status] ?? status);

export const statusLabelInline = (status: string | undefined): string =>
  statusLabel(status).toLowerCase();
