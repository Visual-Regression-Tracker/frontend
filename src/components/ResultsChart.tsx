import { Box, Link as MuiLink, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { StatusChip } from "./StatusChip";
import { Tooltip } from "./Tooltip";
import { BuildResult, TestStatus } from "../types";
import { statusColor } from "../theme";
import { formatShortDate, pluralize } from "../_helpers/format.helper";
import {
  buildProjectPageUrl,
  buildTestRunLocation,
} from "../_helpers/route.helpers";

const STACK: TestStatus[] = [
  TestStatus.ok,
  TestStatus.approved,
  TestStatus.autoApproved,
  TestStatus.new,
  TestStatus.unresolved,
  TestStatus.failed,
];

// ok, approved and auto-approved share one colour, so they differ by opacity
const SEGMENT_OPACITY: Partial<Record<TestStatus, number>> = {
  [TestStatus.approved]: 0.7,
  [TestStatus.autoApproved]: 0.45,
};

const CHART_HEIGHT = 240;
const LABELLED_BARS = 20;

const total = (build: BuildResult) =>
  STACK.reduce((sum, status) => sum + build.counts[status], 0);

const buildName = (build: BuildResult) =>
  build.number === null ? "Build" : `Build #${build.number}`;

const present = (build: BuildResult) =>
  STACK.filter((status) => build.counts[status] > 0);

const describe = (build: BuildResult) => {
  const runs = total(build);
  const breakdown = present(build)
    .map((status) => `${build.counts[status]} ${status}`)
    .join(", ");
  const detail = breakdown ? ` (${breakdown})` : "";
  return `${buildName(build)}: ${runs} ${pluralize(runs, "run")}${detail}`;
};

const BarTooltip = ({ build }: { build: BuildResult }) => (
  <Stack spacing={0.5}>
    <Typography variant="subtitle2">
      {buildName(build)}
      {build.branchName && ` · ${build.branchName}`}
    </Typography>
    <Typography variant="caption">
      {formatShortDate(build.createdAt)}
    </Typography>
    {present(build).map((status) => (
      <Stack
        key={status}
        direction="row"
        spacing={2}
        sx={{ justifyContent: "space-between" }}
      >
        <StatusChip status={status} variant="dot" />
        <span>{build.counts[status]}</span>
      </Stack>
    ))}
    {total(build) === 0 && <span>No runs</span>}
  </Stack>
);

export const ResultsChart = ({
  builds,
  projectId,
}: {
  builds: BuildResult[];
  projectId: string;
}) => {
  const tallest = Math.max(1, ...builds.map(total));
  const labelled = builds.length <= LABELLED_BARS;

  return (
    <Box>
      <Box
        role="list"
        aria-label="Results per build"
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: builds.length > 60 ? 0.25 : 0.75,
          height: CHART_HEIGHT + (labelled ? 24 : 0),
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {builds.map((build) => (
          <Box
            key={build.id}
            role="listitem"
            sx={{
              flex: "1 1 0",
              minWidth: 0,
              maxWidth: 56,
              height: "100%",
              display: "flex",
            }}
          >
            <Tooltip title={<BarTooltip build={build} />}>
              <MuiLink
                component={Link}
                to={{
                  pathname: buildProjectPageUrl(projectId),
                  search: buildTestRunLocation(build.id).search,
                }}
                aria-label={describe(build)}
                underline="none"
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  color: "text.secondary",
                  borderRadius: 0.5,
                  "&:hover, &:focus-visible": { bgcolor: "action.hover" },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column-reverse",
                    height: CHART_HEIGHT,
                    justifyContent: "flex-start",
                  }}
                >
                  {present(build).map((status) => {
                    const color = statusColor(status);
                    return (
                      <Box
                        key={status}
                        data-testid={`segment-${status}`}
                        sx={{
                          height: `${(build.counts[status] / tallest) * 100}%`,
                          minHeight: 2,
                          bgcolor: `${color}.main`,
                          opacity: SEGMENT_OPACITY[status] ?? 1,
                        }}
                      />
                    );
                  })}
                </Box>
                {labelled && (
                  <Typography
                    variant="caption"
                    sx={{ height: 24, textAlign: "center", lineHeight: "24px" }}
                  >
                    {build.number ?? "-"}
                  </Typography>
                )}
              </MuiLink>
            </Tooltip>
          </Box>
        ))}
      </Box>
      <Stack
        direction="row"
        spacing={2}
        useFlexGap
        sx={{ flexWrap: "wrap", mt: 2 }}
      >
        {STACK.map((status) => (
          <Stack
            key={status}
            direction="row"
            spacing={0.75}
            data-testid={`legend-${status}`}
            sx={{ alignItems: "center", fontSize: "0.8125rem" }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: `${statusColor(status)}.main`,
                opacity: SEGMENT_OPACITY[status] ?? 1,
              }}
            />
            <span>{status}</span>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};
