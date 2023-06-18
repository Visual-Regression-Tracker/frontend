import React from "react";
import { Grid, Typography } from "@material-ui/core";
import { TestRun } from "../types";
import TestStatusChip from "./TestStatusChip";
import { Tooltip } from "./Tooltip";

interface IProps {
  testRun: TestRun;
}
export const TestRunDetails: React.FunctionComponent<IProps> = ({
  testRun,
}) => {
  return (
    <Grid container spacing={2}>
      {testRun.os && (
        <Grid item>
          <Typography>OS: {testRun.os}</Typography>
        </Grid>
      )}
      {testRun.device && (
        <Grid item>
          <Typography>Device: {testRun.device}</Typography>
        </Grid>
      )}
      {testRun.browser && (
        <Grid item>
          <Typography>Browser: {testRun.browser}</Typography>
        </Grid>
      )}
      {testRun.viewport && (
        <Grid item>
          <Typography>Viewport: {testRun.viewport}</Typography>
        </Grid>
      )}
      {testRun.customTags && (
        <Grid item>
          <Typography>Custom Tags: {testRun.customTags}</Typography>
        </Grid>
      )}
      <Grid item>
        <Tooltip title="How many percent of pixels are different according to the defined settings.">
          <Typography>Diff: {testRun.diffPercent}%</Typography>
        </Tooltip>
      </Grid>
      <Grid item>
        <Tooltip title="The allowed diff tolerance. Can be set with the diffTollerancePercent property in the track method.">
          <Typography>
            Diff tolerance: {testRun.diffTollerancePercent}%
          </Typography>
        </Tooltip>
      </Grid>
    </Grid>
  );
};
