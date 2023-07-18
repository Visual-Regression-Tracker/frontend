import { FormControlLabel, Switch } from "@mui/material";
import React from "react";
import { TextValidator } from "react-material-ui-form-validator";
import { LooksSameConfig } from "../../types/imageComparison";
import { useConfigHook } from "./useConfigHook";

export const LooksSameConfigForm: React.FunctionComponent = () => {
  const [config, updateConfig] = useConfigHook<LooksSameConfig>();

  return (
    <React.Fragment>
      <FormControlLabel
        label="Strict"
        control={
          <Switch
            checked={config.strict}
            onChange={(event, checked) => updateConfig("strict", checked)}
            color="primary"
            name="strict"
          />
        }
      />
      <TextValidator
        name="tolerance"
        validators={["minNumber:0"]}
        errorMessages={["Enter greater than 0"]}
        InputProps={{ inputProps: { min: 0, step: 0.001 } }}
        margin="dense"
        id="tolerance"
        label="Tolerance"
        type="number"
        fullWidth
        helperText="Default tolerance in non-strict mode is 2.3 which is enough for the most cases. Setting tolerance to 0 will produce the same result as strict: true, but strict mode is faster. Attempt to set tolerance in strict mode will produce an error."
        value={config.tolerance}
        onChange={(event) => {
          const value = (event.target as HTMLInputElement).value;
          updateConfig("tolerance", parseFloat(value));
        }}
      />
      <FormControlLabel
        label="Ignore anti-alliasing"
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
      <TextValidator
        name="antialiasingTolerance"
        validators={["minNumber:0"]}
        errorMessages={["Enter greater than 0"]}
        InputProps={{ inputProps: { min: 0, step: 0.001 } }}
        margin="dense"
        id="antialiasingTolerance"
        label="Antialiasing tolerance"
        type="number"
        fullWidth
        helperText="Minimum difference in brightness (zero by default) between the darkest/lightest pixel (which is adjacent to the antialiasing pixel) and theirs adjacent pixels."
        value={config.antialiasingTolerance}
        onChange={(event) => {
          const value = (event.target as HTMLInputElement).value;
          updateConfig("antialiasingTolerance", parseFloat(value));
        }}
      />
      <FormControlLabel
        label="Ignore carret"
        control={
          <Switch
            checked={config.ignoreCaret}
            onChange={(event, checked) => updateConfig("ignoreCaret", checked)}
            color="primary"
            name="ignoreCaret"
          />
        }
      />
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
    </React.Fragment>
  );
};
