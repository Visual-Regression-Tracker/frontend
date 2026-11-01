import { FormControlLabel, Switch } from "@mui/material";
import { type ChangeEvent, Fragment } from "react";
import { TextValidator } from "react-material-ui-form-validator";
import { DEFAULT_BLUR_AMPLITUDE_THRESHOLD } from "../../constants";
import { BlurAmplitudeConfig } from "../../types/imageComparison";
import { Tooltip } from "../Tooltip";
import { Dinov2Fields } from "./Dinov2Fields";
import { useConfigHook } from "./useConfigHook";

export const BlurAmplitudeFields = () => {
  const [config, updateConfig] = useConfigHook<BlurAmplitudeConfig>();

  // absent: backend default; null: cleared, which the required validator refuses
  const threshold =
    config.blurAmplitudeThreshold === undefined
      ? DEFAULT_BLUR_AMPLITUDE_THRESHOLD
      : (config.blurAmplitudeThreshold ?? "");

  return (
    <Fragment>
      <Tooltip title="Pass a failing comparison when its change, blurred by about a pixel, is no stronger than anti-aliasing or sub-pixel rendering noise.">
        <FormControlLabel
          label="Ignore rendering noise"
          control={
            <Switch
              checked={config.blurAmplitudeFilter === true}
              onChange={(_event, checked) =>
                updateConfig("blurAmplitudeFilter", checked)
              }
              color="primary"
              name="blurAmplitudeFilter"
            />
          }
        />
      </Tooltip>
      {config.blurAmplitudeFilter === true && (
        <Fragment>
          <TextValidator
            name="blurAmplitudeThreshold"
            // minNumber and maxNumber compare whole numbers: 128.5 would pass
            validators={["required", "minFloat:0", "maxFloat:128"]}
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
                // fractions are valid; a whole step would make the browser refuse them
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
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const value = parseFloat(event.target.value);
              updateConfig(
                "blurAmplitudeThreshold",
                Number.isNaN(value) ? null : value,
              );
            }}
          />
          <Dinov2Fields />
        </Fragment>
      )}
    </Fragment>
  );
};
