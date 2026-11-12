import { useMemo, useRef } from "react";
import { Chip, Stack } from "@mui/material";
import { type TestRun, TestStatus } from "../types";
import { statusColor } from "../theme";
import { statusLabel } from "../_helpers/statusLabel.helper";
import { statusesByAttention } from "../_helpers/testRunStatus.helper";

interface IProps {
  testRuns: TestRun[];
  statuses: TestStatus[];
  onStatusesChange: (statuses: TestStatus[]) => void;
}

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

  const allChip = useRef<HTMLDivElement>(null);

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
        ref={allChip}
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
        if (count === 0 && !active) {
          return null;
        }
        return (
          <Chip
            key={status}
            size="small"
            clickable
            aria-pressed={active}
            variant={active ? "filled" : "outlined"}
            color={statusColor(status)}
            label={`${statusLabel(status)} ${count}`}
            onClick={() => {
              // turning it off removes this chip, so keep focus in the row
              if (count === 0) {
                allChip.current?.focus();
              }
              toggle(status);
            }}
          />
        );
      })}
    </Stack>
  );
};
