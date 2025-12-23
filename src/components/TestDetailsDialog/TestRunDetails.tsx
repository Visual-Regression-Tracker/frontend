import React from "react";
import { Grid, Typography, Paper, type Theme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { TestRun } from "../../types";
import { Tooltip } from "../Tooltip";

const useStyles = makeStyles((theme: Theme) => ({
  vlmContainer: {
    padding: theme.spacing(1.5),
    marginTop: theme.spacing(1),
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderLeft: "3px solid",
    borderColor: theme.palette.primary.main,
  },
  vlmLabel: {
    fontWeight: 600,
    display: "block",
    marginBottom: theme.spacing(0.5),
    color: theme.palette.text.secondary,
  },
  vlmDescription: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    lineHeight: 1.6,
  },
}));

interface IProps {
  testRun: TestRun;
}

export const TestRunDetails: React.FunctionComponent<IProps> = ({
  testRun,
}) => {
  const classes = useStyles();

  return (
    <React.Fragment>
      {testRun.os && (
        <Grid item>
          <Typography variant="caption">OS: {testRun.os}</Typography>
        </Grid>
      )}
      {testRun.device && (
        <Grid item>
          <Typography variant="caption">Device: {testRun.device}</Typography>
        </Grid>
      )}
      {testRun.browser && (
        <Grid item>
          <Typography variant="caption">Browser: {testRun.browser}</Typography>
        </Grid>
      )}
      {testRun.viewport && (
        <Grid item>
          <Typography variant="caption">Viewport: {testRun.viewport}</Typography>
        </Grid>
      )}
      {testRun.customTags && (
        <Grid item>
          <Typography variant="caption">
            Custom Tags: {testRun.customTags}
          </Typography>
        </Grid>
      )}
      <Grid item>
        <Tooltip title="How many percent of pixels are different according to the defined settings.">
          <Typography variant="caption">
            <strong>Diff: {Math.round(testRun.diffPercent * 100) / 100}%</strong>
          </Typography>
        </Tooltip>
      </Grid>
      <Grid item>
        <Tooltip title="The allowed diff tolerance. Can be set with the diffTollerancePercent property in the track method.">
          <Typography variant="caption">
            <strong>Diff tolerance: {testRun.diffTollerancePercent}%</strong>
          </Typography>
        </Tooltip>
      </Grid>
      {testRun.vlmDescription && (
        <Grid item xs={12}>
          <Tooltip title="AI-generated description of the differences found by the Vision Language Model (VLM).">
            <Paper elevation={0} className={classes.vlmContainer}>
              <Typography variant="caption" className={classes.vlmLabel}>
                VLM Analysis:
              </Typography>
              <Typography variant="body2" className={classes.vlmDescription}>
                {testRun.vlmDescription}
              </Typography>
            </Paper>
          </Tooltip>
        </Grid>
      )}
    </React.Fragment>
  );
};
