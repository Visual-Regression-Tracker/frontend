import React from "react";
import {
  Typography,
  Chip,
  Grid,
  Box,
  Button,
  LinearProgress,
} from "@material-ui/core";
import { Build } from "../types";
import { BuildStatusChip } from "./BuildStatusChip";
import { useSnackbar } from "notistack";
import { buildsService } from "../services";
import { formatDateTime } from "../_helpers/format.helper";

interface IProps {
  build: Build;
}

const BuildDetails: React.FunctionComponent<IProps> = ({ build }) => {
  const { enqueueSnackbar } = useSnackbar();

  return (
    <Grid container direction="column">
      <Grid item>
        <Box m={0.5}>
          <Grid container spacing={1} alignItems="center">
            <Grid item>
              <Typography variant="subtitle2">{`#${build.number} ${
                build.ciBuildId || ""
              }`}</Typography>
            </Grid>
            <Grid item>
              <Chip size="small" label={build.branchName} />
            </Grid>
            <Grid item>
              <BuildStatusChip status={build.status} />
            </Grid>
            {build.unresolvedCount > 0 && (
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
                      .approve(build.id, build.merge)
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
                {formatDateTime(build.createdAt)}
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
                build.unresolvedCount + build.failedCount + build.passedCount
              } total`}</Typography>
            </Grid>
            <Grid item>
              <Typography variant="caption">{`${build.unresolvedCount} unresolved`}</Typography>
            </Grid>
            <Grid item>
              <Typography variant="caption">{`${build.failedCount} failed`}</Typography>
            </Grid>
            <Grid item>
              <Typography variant="caption">{`${build.passedCount} passed`}</Typography>
            </Grid>
          </Grid>
        </Box>
      </Grid>
      {build.isRunning && <LinearProgress />}
    </Grid>
  );
};

export default BuildDetails;
