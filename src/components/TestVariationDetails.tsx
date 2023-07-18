import React from "react";
import { Grid, Typography, Chip } from "@mui/material";
import { TestVariation } from "../types";

interface IProps {
  testVariation: TestVariation;
}

export const TestVariationDetails: React.FunctionComponent<IProps> = ({
  testVariation,
}) => (
  <Grid container direction="column" spacing={2}>
    <Typography>{testVariation.name}</Typography>
    <Grid container spacing={2}>
      {testVariation.os && (
        <Grid item>
          <Typography>OS: {testVariation.os}</Typography>
        </Grid>
      )}
      {testVariation.device && (
        <Grid item>
          <Typography>Device: {testVariation.device}</Typography>
        </Grid>
      )}
      {testVariation.customTags && (
        <Grid item>
          <Typography>Custom Tags: {testVariation.customTags}</Typography>
        </Grid>
      )}
      {testVariation.browser && (
        <Grid item>
          <Typography>Browser: {testVariation.browser}</Typography>
        </Grid>
      )}
      {testVariation.viewport && (
        <Grid item>
          <Typography>Viewport: {testVariation.viewport}</Typography>
        </Grid>
      )}
      <Grid item>
        <Chip size="small" label={testVariation.branchName} />
      </Grid>
    </Grid>
  </Grid>
);
