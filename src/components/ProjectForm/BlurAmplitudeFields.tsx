import { FormControlLabel, Switch } from "@mui/material";
import React from "react";
import { TextValidator } from "react-material-ui-form-validator";
import { DEFAULT_BLUR_AMPLITUDE_THRESHOLD } from "../../constants";
import { BlurAmplitudeConfig } from "../../types/imageComparison";
import { Tooltip } from "../Tooltip";
import { useConfigHook } from "./useConfigHook";

// Rendered by the config form of every library that supports the filter.
export const BlurAmplitudeFields: React.FunctionComponent = () => {
  const [config, updateConfig] = useConfigHook<BlurAmplitudeConfig>();

  // absent: the backend default applies; null: the field was cleared, which
  // the required validator then refuses
  const threshold =
    config.blurAmplitudeThreshold === undefined
      ? DEFAULT_BLUR_AMPLITUDE_THRESHOLD
      : (config.blurAmplitudeThreshold ?? "");

  return (
    <React.Fragment>
      <Tooltip title="Pass a failing comparison when its change, blurred by about a pixel, is no stronger than anti-aliasing or sub-pixel rendering noise.">
        <FormControlLabel
          label="Ignore rendering noise"
          control={
            <Switch
              checked={config.blurAmplitudeFilter === true}
              onChange={(event, checked) =>
                updateConfig("blurAmplitudeFilter", checked)
              }
              color="primary"
              name="blurAmplitudeFilter"
            />
          }
        />
      </Tooltip>
      {config.blurAmplitudeFilter === true && (
        <TextValidator
          name="blurAmplitudeThreshold"
          validators={["required", "minNumber:0", "maxNumber:128"]}
          errorMessages={[
            "Enter a threshold",
            "Enter at least 0",
            "Enter at most 128",
          ]}
          slotProps={{
            htmlInput: {
              min: 0,
              // the backend's ceiling: near 255 almost any change would pass
              max: 128,
              // the backend takes fractions; a whole step would make the
              // browser refuse them
              step: "any",
            },
          }}
          margin="dense"
          id="blurAmplitudeThreshold"
          label="Rendering noise threshold"
          helperText="Strongest blurred difference (0-128) still treated as noise. Lower is stricter."
          type="number"
          fullWidth
          value={threshold}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const value = parseFloat(event.target.value);
            updateConfig(
              "blurAmplitudeThreshold",
              Number.isNaN(value) ? null : value,
            );
          }}
        />
      )}
    </React.Fragment>
  );
};
