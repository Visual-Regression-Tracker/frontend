import { FormControlLabel, Switch } from "@material-ui/core";
import React from "react";
import { TextValidator } from "react-material-ui-form-validator";
import { PixelmatchConfig } from "../../types/imageComparison";
import { Tooltip } from "../Tooltip";
import { useConfigHook } from "./useConfigHook";

export const PixelmatchConfigForm: React.FunctionComponent = () => {
  const [config, updateConfig] = useConfigHook<PixelmatchConfig>();

  return (
    <React.Fragment>
      <Tooltip
        title="Enable comparison of images with different sizes."
      >
        <FormControlLabel
          label="Allow diff dimensions"
          control={
            <Switch
              checked={config.allowDiffDimensions}
              onChange={(event, checked) =>
                updateConfig("allowDiffDimensions", checked)
              }
              color="primary"
              name="diffDimensionsFeature"
            />
          }
        />
      </Tooltip>
      <Tooltip
        title="Ignore detecting and ignoring anti-aliased pixels."
      >
        <FormControlLabel
          label="Ignore anti-aliasing"
          control={
            <Switch
              checked={config.ignoreAntialiasing}
              onChange={(event, checked) =>
                updateConfig("ignoreAntialiasing", checked)
              }
              color="primary"
              name="ignoreAntialiasing"
            />
          }
        />
      </Tooltip>
      <TextValidator
        name="threshold"
        validators={["minNumber:0", "maxNumber:1"]}
        errorMessages={["Enter greater than 0", "Enter less than 1"]}
        InputProps={{ inputProps: { min: 0, max: 1, step: 0.001 } }}
        margin="dense"
        id="threshold"
        label="Pixel diff threshold"
        helperText="The threshold of how much a pixel can deviate until it is detected as change (0-1)."
        type="number"
        fullWidth
        required
        value={config.threshold}
        onChange={(event) => {
          const value = (event.target as HTMLInputElement).value;
          updateConfig("threshold", parseFloat(value));
        }}
      />
    </React.Fragment>
  );
};
