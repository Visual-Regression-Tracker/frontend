import { FormControlLabel, FormHelperText, Switch } from "@mui/material";
import { Fragment } from "react";
import { useDinov2Status } from "../../_helpers/useDinov2Status";
import { Dinov2Status, RenderingNoiseConfig } from "../../types";
import { Tooltip } from "../Tooltip";
import { useConfigHook } from "./useConfigHook";

// without the service the backend leaves the filter off
const statusNote = (
  status: Dinov2Status | undefined,
  checked: boolean,
): { text: string; error?: boolean; warning?: boolean } | undefined => {
  if (status === undefined) {
    return undefined;
  }
  if (!status.configured) {
    return checked
      ? {
          text: "This server has no DINOv2 service, so the filter passes nothing. Turn it off or set DINOV2_URL on the backend.",
          error: true,
        }
      : {
          text: "Not available: this server has no DINOv2 service (DINOV2_URL).",
        };
  }
  if (!status.available) {
    return {
      text: "The DINOv2 service is not answering right now. Until it does, runs the filter would pass go to review.",
      warning: true,
    };
  }
  return undefined;
};

export const RenderingNoiseField = () => {
  const [config, updateConfig] = useConfigHook<RenderingNoiseConfig>();
  const status = useDinov2Status();
  const checked = config.ignoreRenderingNoise === true;
  const note = statusNote(status, checked);

  return (
    <Fragment>
      <Tooltip title="Pass a failing comparison when its change, blurred by about a pixel, is no stronger than anti-aliasing and the DINOv2 service sees no change of content.">
        <FormControlLabel
          label="Ignore rendering noise"
          // a project saved with the filter on can still turn it off
          disabled={!checked && !status?.configured}
          control={
            <Switch
              checked={checked}
              onChange={(_event, value) =>
                updateConfig("ignoreRenderingNoise", value)
              }
              color="primary"
              name="ignoreRenderingNoise"
            />
          }
        />
      </Tooltip>
      {note && (
        <FormHelperText
          id="renderingNoiseStatus"
          error={note.error}
          sx={note.warning ? { color: "warning.main" } : undefined}
        >
          {note.text}
        </FormHelperText>
      )}
    </Fragment>
  );
};
