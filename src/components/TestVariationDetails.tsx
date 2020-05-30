import React from "react";
import { Grid, Typography } from "@material-ui/core";
import { TestVariation } from "../types";

interface IProps {
  testVariation: TestVariation;
}
export const TestVariationDetails: React.FunctionComponent<IProps> = ({
  testVariation,
}) => {
  return (
    <Grid container direction="column" spacing={2}>
      <Typography>{testVariation.name}</Typography>

      <Grid container spacing={2}>
        {testVariation.os && (
          <Grid item>
            <Typography>OS: {testVariation.os}</Typography>
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
      </Grid>
    </Grid>
  );
};
