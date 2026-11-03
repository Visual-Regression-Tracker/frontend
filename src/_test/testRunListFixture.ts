import type { ToolbarPropsOverrides } from "@mui/x-data-grid";
import { run } from "../_helpers/testRun.fixture";
import {
  groupTestRuns,
  singleRunGroups,
} from "../_helpers/testRunGroup.helper";
import { TestRun, TestStatus } from "../types";
import type { TestRunView } from "../components/TestRunList/TestRunListControls";

export const A_EN = run({
  id: "a-en",
  name: "Screen A",
  customTags: "en",
  imageName: "a-en.png",
  diffName: "a-en-diff.png",
});
export const A_DE = run({
  id: "a-de",
  name: "Screen A",
  customTags: "de",
  status: TestStatus.approved,
});
export const B_EN = run({ id: "b-en", name: "Screen B", customTags: "en" });

export const toolbarProps = (view: TestRunView): ToolbarPropsOverrides => ({
  selectedIds: [],
  rows: [],
  view,
  onViewChange: vi.fn(),
  density: "standard",
  onDensityChange: vi.fn(),
  grouped: false,
  onGroupedChange: vi.fn(),
  groupByAxis: "customTags",
  onProcessed: vi.fn(),
});

export const groupsFor = (runs: TestRun[], grouped: boolean) =>
  grouped ? groupTestRuns(runs, "customTags") : singleRunGroups(runs);
