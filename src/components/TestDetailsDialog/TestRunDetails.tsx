import React from "react";
import { Grid, Typography } from "@mui/material";
import { TestRun } from "../../types";
import { Tooltip } from "../Tooltip";

interface IProps {
  testRun: TestRun;
}

export const TestRunDetails: React.FunctionComponent<IProps> = ({
  testRun,
}) => (
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
  </React.Fragment>
);
