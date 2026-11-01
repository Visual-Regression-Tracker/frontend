import { FormControlLabel, FormHelperText, Switch } from "@mui/material";
import { type ChangeEvent, Fragment } from "react";
import { TextValidator } from "react-material-ui-form-validator";
import { useDinov2Status } from "../../_helpers/useDinov2Status";
import { DEFAULT_DINOV2_THRESHOLD } from "../../constants";
import { BlurAmplitudeConfig, Dinov2Status } from "../../types";
import { Tooltip } from "../Tooltip";
import { useConfigHook } from "./useConfigHook";

// with no service the backend sends every run the filter would pass to review
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
          text: "This server has no DINOv2 service: every run the filter would pass goes to review. Turn the check off or set DINOV2_URL on the backend.",
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

export const Dinov2Fields = () => {
  const [config, updateConfig] = useConfigHook<BlurAmplitudeConfig>();
  const status = useDinov2Status();
  const checked = config.dinov2Check === true;
  const note = statusNote(status, checked);

  // absent: backend default; null: cleared, which the required validator refuses
  const threshold =
    config.dinov2Threshold === undefined
      ? DEFAULT_DINOV2_THRESHOLD
      : (config.dinov2Threshold ?? "");

  return (
    <Fragment>
      <Tooltip title="Before a run passes as rendering noise, the DINOv2 service compares what the two screenshots show. Catches faint changes of content the blur misses, such as a missing light icon.">
        <FormControlLabel
          label="Check with DINOv2"
          disabled={!checked && !status?.configured}
          control={
            <Switch
              checked={checked}
              onChange={(_event, value) => updateConfig("dinov2Check", value)}
              color="primary"
              name="dinov2Check"
            />
          }
        />
      </Tooltip>
      {note && (
        <FormHelperText
          id="dinov2Status"
          error={note.error}
          sx={note.warning ? { color: "warning.main" } : undefined}
        >
          {note.text}
        </FormHelperText>
      )}
      {checked && (
        <TextValidator
          name="dinov2Threshold"
          validators={["required", "minFloat:0.01", "maxFloat:2"]}
          errorMessages={[
            "Enter a threshold",
            "Enter at least 0.01",
            "Enter at most 2",
          ]}
          slotProps={{
            htmlInput: {
              min: 0.01,
              // cosine distance: 2 is as different as two patches get
              max: 2,
              step: "any",
            },
          }}
          margin="dense"
          id="dinov2Threshold"
          label="DINOv2 threshold"
          helperText="Content change (0.01-2) still treated as noise. Lower is stricter."
          type="number"
          fullWidth
          value={threshold}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const value = parseFloat(event.target.value);
            updateConfig("dinov2Threshold", Number.isNaN(value) ? null : value);
          }}
        />
      )}
    </Fragment>
  );
};
