import { useMemo } from "react";
import { Chip, Stack } from "@mui/material";
import { type TestRun, TestStatus } from "../types";
import { statusColor } from "../theme";
import { statusesByAttention } from "../_helpers/testRunStatus.helper";

interface IProps {
  testRuns: TestRun[];
  statuses: TestStatus[];
  onStatusesChange: (statuses: TestStatus[]) => void;
}

const labelOf = (status: TestStatus) => {
  const words = status.replace(/([A-Z])/g, " $1").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const ALL_STATUSES = statusesByAttention(Object.values(TestStatus));

export const BuildStatusCounters = ({
  testRuns,
  statuses,
  onStatusesChange,
}: IProps) => {
  const counts = useMemo(() => {
    const result = new Map<TestStatus, number>();
    testRuns.forEach((run) =>
      result.set(run.status, (result.get(run.status) ?? 0) + 1),
    );
    return result;
  }, [testRuns]);

  const toggle = (status: TestStatus) =>
    onStatusesChange(
      statuses.includes(status)
        ? statuses.filter((item) => item !== status)
        : [...statuses, status],
    );

  return (
    <Stack
      direction="row"
      role="group"
      aria-label="Filter by status"
      sx={{ flexWrap: "wrap", gap: 0.5 }}
    >
      <Chip
        size="small"
        clickable
        aria-pressed={statuses.length === 0}
        variant={statuses.length === 0 ? "filled" : "outlined"}
        color={statuses.length === 0 ? "primary" : "default"}
        label={`All ${testRuns.length}`}
        onClick={() => onStatusesChange([])}
      />
      {ALL_STATUSES.map((status) => {
        const count = counts.get(status) ?? 0;
        const active = statuses.includes(status);
        return (
          <Chip
            key={status}
            size="small"
            clickable
            disabled={count === 0 && !active}
            aria-pressed={active}
            variant={active ? "filled" : "outlined"}
            color={statusColor(status)}
            label={`${labelOf(status)} ${count}`}
            onClick={() => toggle(status)}
          />
        );
      })}
    </Stack>
  );
};
