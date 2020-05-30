import React from "react";
import { Grid, Typography } from "@material-ui/core";
import { TestRun } from "../types";
import TestStatusChip from "./TestStatusChip";

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
      <Grid item>
        <Typography>Diff: {testRun.diffPercent}%</Typography>
      </Grid>
      <Grid item>
        <Typography>
          Diff tollerance: {testRun.diffTollerancePercent}%
        </Typography>
      </Grid>
      <Grid item>
        <Typography display="inline">Status: </Typography>
        <TestStatusChip status={testRun.status} />
      </Grid>
    </Grid>
  );
};
