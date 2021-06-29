import { FormControlLabel, Switch } from "@material-ui/core";
import React from "react";
import { TextValidator } from "react-material-ui-form-validator";
import { OdiffConfig } from "../../types/imageComparison";
import { useConfigHook } from "./useConfigHook";

export const OdiffConfigForm: React.FunctionComponent = () => {
  const [config, updateConfig] = useConfigHook<OdiffConfig>();

  return (
    <React.Fragment>
      <FormControlLabel
        label="Output diff mask"
        control={
          <Switch
            checked={config.outputDiffMask}
            onChange={(event, checked) =>
              updateConfig("outputDiffMask", checked)
            }
            color="primary"
            name="strict"
          />
        }
      />
      <FormControlLabel
        label="Fail on layout diff"
        control={
          <Switch
            checked={config.failOnLayoutDiff}
            onChange={(event, checked) =>
              updateConfig("failOnLayoutDiff", checked)
            }
            color="primary"
            name="strict"
          />
        }
      />
      <FormControlLabel
        label="Ignore anti-alliasing"
        control={
          <Switch
            checked={config.antialiasing}
            onChange={(event, checked) => updateConfig("antialiasing", checked)}
            color="primary"
            name="antialiasing"
          />
        }
      />
      <TextValidator
        name="threshold"
        validators={["minNumber:0", "maxNumber:1"]}
        errorMessages={["Enter greater than 0", "Enter less than 1"]}
        InputProps={{ inputProps: { min: 0, max: 1, step: 0.001 } }}
        margin="dense"
        id="threshold"
        label="Pixel diff threshold"
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
