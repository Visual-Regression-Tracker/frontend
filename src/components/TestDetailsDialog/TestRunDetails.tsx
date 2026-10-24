import React from "react";
import { Chip, GridLegacy as Grid, Typography, Paper } from "@mui/material";
import { TestRun } from "../../types";
import { Tooltip } from "../Tooltip";

interface IProps {
  testRun: TestRun;
}

export const TestRunDetails: React.FunctionComponent<IProps> = ({
  testRun,
}) => {
  const attributes = [
    { name: "OS", value: testRun.os },
    { name: "Device", value: testRun.device },
    { name: "Browser", value: testRun.browser },
    { name: "Viewport", value: testRun.viewport },
    { name: "Custom Tags", value: testRun.customTags },
  ];

  return (
    <React.Fragment>
      {attributes
        .filter((attribute) => attribute.value)
        .map((attribute) => (
          <Grid item key={attribute.name}>
            <Tooltip title={attribute.name}>
              <Chip size="small" label={attribute.value} />
            </Tooltip>
          </Grid>
        ))}
      <Grid item>
        <Tooltip title="How many percent of pixels are different according to the defined settings.">
          <Typography variant="caption">
            <strong>
              Diff: {Math.round(testRun.diffPercent * 100) / 100}%
            </strong>
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
            <Paper
              elevation={0}
              sx={{
                padding: 1.5,
                marginTop: 1,
                backgroundColor: "rgba(0, 0, 0, 0.02)",
                borderLeft: "3px solid",
                borderColor: "primary.main",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 0.5,
                  color: "text.secondary",
                }}
              >
                VLM Analysis:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  lineHeight: 1.6,
                }}
              >
                {testRun.vlmDescription}
              </Typography>
            </Paper>
          </Tooltip>
        </Grid>
      )}
    </React.Fragment>
  );
};
