import React from "react";
import { Typography, Chip, Grid, Box, LinearProgress } from "@mui/material";
import { BuildStatusChip } from "./BuildStatusChip";
import { formatDateTime } from "../_helpers/format.helper";
import { useBuildState } from "../contexts";
import { LOCATOR_BUILD_DETAILS } from "../constants/help";
import { Tooltip } from "./Tooltip";

const BuildDetails: React.FunctionComponent = () => {
  const { selectedBuild } = useBuildState();
  const buildNumber = React.useMemo(
    () => `#${selectedBuild?.number} ${selectedBuild?.ciBuildId || ""}`,
    [selectedBuild?.number, selectedBuild?.ciBuildId],
  );

  if (!selectedBuild) {
    return null;
  }

  const loadingAnimation = selectedBuild.isRunning && <LinearProgress />;

  return (
    <Grid container direction="column" id={LOCATOR_BUILD_DETAILS}>
      <Grid item>
        <Box m={0.5}>
          <Grid container spacing={1} alignItems="center">
            <Grid item style={{ maxWidth: "20%", whiteSpace: "nowrap" }}>
              <Tooltip title={buildNumber}>
                <Typography
                  variant="subtitle2"
                  style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {buildNumber}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid item style={{ maxWidth: "70%" }}>
              <Tooltip title={selectedBuild.branchName}>
                <Chip
                  size="small"
                  style={{ maxWidth: "100%" }}
                  label={selectedBuild.branchName}
                />
              </Tooltip>
            </Grid>
            <Grid item>
              <BuildStatusChip status={selectedBuild.status} />
            </Grid>
          </Grid>
        </Box>
      </Grid>
      <Grid item>
        <Box m={0.5}>
          <Grid container spacing={1}>
            <Grid item>
              <Typography variant="caption">
                {formatDateTime(selectedBuild.createdAt)}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Grid>
      <Grid item>
        <Box m={0.5}>
          <Grid container spacing={1}>
            <Grid item>
              <Typography variant="caption">{`${
                selectedBuild.unresolvedCount +
                selectedBuild.failedCount +
                selectedBuild.passedCount
              } total`}</Typography>
            </Grid>
            <Grid item>
              <Typography variant="caption">{`${selectedBuild.unresolvedCount} unresolved`}</Typography>
            </Grid>
            <Grid item>
              <Typography variant="caption">{`${selectedBuild.failedCount} failed`}</Typography>
            </Grid>
            <Grid item>
              <Typography variant="caption">{`${selectedBuild.passedCount} passed`}</Typography>
            </Grid>
          </Grid>
        </Box>
      </Grid>
      {loadingAnimation}
    </Grid>
  );
};

export default BuildDetails;
