import { FormControlLabel, Switch } from "@mui/material";
import { Fragment } from "react";
import { DEFAULT_BLUR_AMPLITUDE_THRESHOLD } from "../../constants";
import { BlurAmplitudeConfig } from "../../types/imageComparison";
import { Tooltip } from "../Tooltip";
import { Dinov2Fields } from "./Dinov2Fields";
import { ThresholdField } from "./ThresholdField";
import { useConfigHook } from "./useConfigHook";

export const BlurAmplitudeFields = () => {
  const [config, updateConfig] = useConfigHook<BlurAmplitudeConfig>();

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
          <ThresholdField
            field="blurAmplitudeThreshold"
            label="Rendering noise threshold"
            helperText="Strongest blurred difference (0-128) still treated as noise. Lower is stricter."
            min={0}
            // the backend's ceiling: near 255 almost any change would pass
            max={128}
            fallback={DEFAULT_BLUR_AMPLITUDE_THRESHOLD}
          />
          <Dinov2Fields />
        </Fragment>
      )}
    </Fragment>
  );
};
