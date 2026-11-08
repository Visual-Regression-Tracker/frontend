import { useMemo, useState } from "react";
import {
  Chip,
  IconButton,
  Stack,
  Typography,
  LinearProgress,
} from "@mui/material";
import { MoreHoriz } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { StatusChip } from "./StatusChip";
import { DateLabel } from "./DateLabel";
import { BuildMenu } from "./BuildMenu";
import { BuildNoiseLine } from "./BuildNoiseLine";
import { BuildStatusCounters } from "./BuildStatusCounters";
import { NoiseBanner } from "./NoiseBanner";
import { Tooltip } from "./Tooltip";
import { useSharedTestRunFilters } from "./TestRunList/TestRunFiltersContext";
import { BuildStatus } from "../types/buildStatus";
import { TestStatus } from "../types/testStatus";
import {
  useAnalyseNoise,
  useBuildDispatch,
  useBuildState,
  useNoiseAnalysisAvailable,
  useTestRunState,
} from "../contexts";
import { LOCATOR_BUILD_DETAILS } from "../constants/locators";
import { buildTestRunLocation } from "../_helpers/route.helpers";
import { hasLaterRun } from "../_helpers/build.helper";
import { noiseHintOf } from "../_helpers/noiseHint.helper";

const BuildDetails = () => {
  const { selectedBuild } = useBuildState();
  const buildDispatch = useBuildDispatch();
  const { testRuns } = useTestRunState();
  const { filteredRows, statuses, onStatusesChange, onNoiseHintsChange } =
    useSharedTestRunFilters();
  const available = useNoiseAnalysisAvailable();
  const { enqueueSnackbar } = useSnackbar();
  const { analyse, requesting } = useAnalyseNoise(enqueueSnackbar);
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const unresolvedIds = useMemo(
    () =>
      filteredRows
        .filter((run) => run.status === TestStatus.unresolved)
        .map((run) => run.id),
    [filteredRows],
  );
  const analysing = useMemo(
    () => filteredRows.some((run) => noiseHintOf(run) === "pending"),
    [filteredRows],
  );

  if (!selectedBuild) {
    return null;
  }

  const analysis = available
    ? {
        label: `Analyse noise (${unresolvedIds.length})`,
        disabled: requesting || analysing || unresolvedIds.length === 0,
        onClick: () => void analyse(unresolvedIds),
      }
    : undefined;
  const buildNumber = `#${selectedBuild.number} ${selectedBuild.ciBuildId || ""}`;

  return (
    <Stack id={LOCATOR_BUILD_DETAILS} sx={{ gap: 1, px: 2, pt: 1.5 }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
        <Tooltip title={buildNumber}>
          <Typography variant="h6" noWrap sx={{ minWidth: 0 }}>
            {buildNumber}
          </Typography>
        </Tooltip>
        <Tooltip title={selectedBuild.branchName}>
          <Chip
            size="small"
            sx={{ maxWidth: "40%" }}
            label={selectedBuild.branchName}
          />
        </Tooltip>
        <StatusChip
          status={selectedBuild.status}
          variant={
            selectedBuild.status === BuildStatus.unresolved
              ? "filled"
              : "outlined"
          }
        />
        <IconButton
          size="small"
          aria-label="Build menu"
          onClick={(event) => setMenuAnchor(event.currentTarget)}
        >
          <MoreHoriz />
        </IconButton>
      </Stack>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        <DateLabel date={selectedBuild.createdAt} />
        {hasLaterRun(selectedBuild) && selectedBuild.updatedAt && (
          <>
            {" · Last run: "}
            <DateLabel date={selectedBuild.updatedAt} />
          </>
        )}
      </Typography>
      <BuildStatusCounters
        testRuns={testRuns}
        statuses={statuses}
        onStatusesChange={onStatusesChange}
      />
      {available && (
        <>
          <BuildNoiseLine
            testRuns={testRuns}
            onShowNoise={() => onNoiseHintsChange?.(["Likely noise"])}
          />
          <NoiseBanner />
        </>
      )}
      {selectedBuild.isRunning && <LinearProgress />}
      {menuAnchor && (
        <BuildMenu
          build={selectedBuild}
          anchorEl={menuAnchor}
          analysis={analysis}
          onClose={() => setMenuAnchor(null)}
          onDeleted={(deleted) => {
            buildDispatch({ type: "refresh", payload: deleted.id });
            void navigate(buildTestRunLocation());
          }}
        />
      )}
    </Stack>
  );
};

export default BuildDetails;
