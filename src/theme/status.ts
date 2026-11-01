import { TestStatus } from "../types/testStatus";
import { BuildStatus } from "../types/buildStatus";

export type StatusColor = "success" | "warning" | "error" | "info" | "default";

// one meaning per colour: green settled, amber awaits review, red failed, blue new
export function statusColor(status: string | undefined): StatusColor {
  switch (status) {
    case TestStatus.new:
      return "info";
    case TestStatus.unresolved:
    case BuildStatus.unresolved:
      return "warning";
    case TestStatus.failed:
    case BuildStatus.failed:
      return "error";
    case TestStatus.ok:
    case TestStatus.approved:
    case TestStatus.autoApproved:
    case BuildStatus.passed:
      return "success";
    default:
      return "default";
  }
}
