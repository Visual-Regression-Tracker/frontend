import React from "react";
import {
  Typography,
  Chip,
  Grid,
  Box,
  Button,
  LinearProgress,
} from "@material-ui/core";
import { BuildStatusChip } from "./BuildStatusChip";
import { useSnackbar } from "notistack";
import { buildsService } from "../services";
import { formatDateTime } from "../_helpers/format.helper";
import { useBuildState } from "../contexts";

const BuildDetails: React.FunctionComponent = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { selectedBuild } = useBuildState();

  if (!selectedBuild) {
    return null;
  }

  return (
    <Grid container direction="column">
      <Grid item>
        <Box m={0.5}>
          <Grid container spacing={1} alignItems="center">
            <Grid item>
              <Typography variant="subtitle2">{`#${selectedBuild.number} ${
                selectedBuild.ciBuildId || ""
              }`}</Typography>
            </Grid>
            <Grid item>
              <Chip size="small" label={selectedBuild.branchName} />
            </Grid>
            <Grid item>
              <BuildStatusChip status={selectedBuild.status} />
            </Grid>
            {selectedBuild.unresolvedCount > 0 && (
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={async () => {
                    enqueueSnackbar(
                      "Wait for the confirmation message until approval is completed.",
                      {
                        variant: "info",
                      }
                    );

                    buildsService
                      .approve(selectedBuild.id, selectedBuild.merge)
                      .then(() =>
                        enqueueSnackbar("All approved.", {
                          variant: "success",
                        })
                      )
                      .catch((err) =>
                        enqueueSnackbar(err, {
                          variant: "error",
                        })
                      );
                  }}
                >
                  Approve All
                </Button>
              </Grid>
            )}
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
      {selectedBuild.isRunning && <LinearProgress />}
    </Grid>
  );
};

export default BuildDetails;
