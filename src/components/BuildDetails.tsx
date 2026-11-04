import { useMemo } from "react";
import {
  Typography,
  Chip,
  Grid,
  Box,
  LinearProgress,
  Stack,
} from "@mui/material";
import { BuildStatusChip } from "./BuildStatusChip";
import { formatDateTime } from "../_helpers/format.helper";
import {
  useBuildState,
  useNoiseAnalysisAvailable,
  useTestRunState,
} from "../contexts";
import { buildNoiseCaption } from "../_helpers/noiseSummary.helper";
import { NoiseBanner } from "./NoiseBanner";
import { LOCATOR_BUILD_DETAILS } from "../constants/help";
import { Tooltip } from "./Tooltip";

const BuildDetails = () => {
  const { selectedBuild } = useBuildState();
  const { testRuns } = useTestRunState();
  const available = useNoiseAnalysisAvailable();
  const noiseCaption = useMemo(
    () => (available ? buildNoiseCaption(testRuns) : null),
    [available, testRuns],
  );
  const buildNumber = useMemo(
    () => `#${selectedBuild?.number} ${selectedBuild?.ciBuildId || ""}`,
    [selectedBuild?.number, selectedBuild?.ciBuildId],
  );

  if (!selectedBuild) {
    return null;
  }

  const loadingAnimation = selectedBuild.isRunning && <LinearProgress />;

  return (
    <Stack id={LOCATOR_BUILD_DETAILS}>
      <Box sx={{ m: 0.5 }}>
        <Grid container spacing={1} sx={{ alignItems: "center" }}>
          <Grid style={{ maxWidth: "20%", whiteSpace: "nowrap" }}>
            <Tooltip title={buildNumber}>
              <Typography
                variant="subtitle2"
                style={{ overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {buildNumber}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid style={{ maxWidth: "70%" }}>
            <Tooltip title={selectedBuild.branchName}>
              <Chip
                size="small"
                style={{ maxWidth: "100%" }}
                label={selectedBuild.branchName}
              />
            </Tooltip>
          </Grid>
          <Grid>
            <BuildStatusChip status={selectedBuild.status} />
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ m: 0.5 }}>
        <Grid container spacing={1}>
          <Grid>
            <Typography variant="caption">
              {formatDateTime(selectedBuild.createdAt)}
            </Typography>
          </Grid>
          {selectedBuild.updatedAt && (
            <Grid>
              <Typography variant="caption" color="textSecondary">
                Last run: {formatDateTime(selectedBuild.updatedAt)}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>
      <Box sx={{ m: 0.5 }}>
        <Grid container spacing={1}>
          <Grid>
            <Typography variant="caption">{`${
              selectedBuild.unresolvedCount +
              selectedBuild.failedCount +
              selectedBuild.passedCount
            } total`}</Typography>
          </Grid>
          <Grid>
            <Typography variant="caption">{`${selectedBuild.unresolvedCount} unresolved`}</Typography>
          </Grid>
          <Grid>
            <Typography variant="caption">{`${selectedBuild.failedCount} failed`}</Typography>
          </Grid>
          <Grid>
            <Typography variant="caption">{`${selectedBuild.passedCount} passed`}</Typography>
          </Grid>
        </Grid>
        {noiseCaption && (
          <Typography variant="caption" color="textSecondary">
            {noiseCaption}
          </Typography>
        )}
      </Box>
      {available && <NoiseBanner />}
      {loadingAnimation}
    </Stack>
  );
};

export default BuildDetails;
