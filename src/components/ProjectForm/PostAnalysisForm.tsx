import {
  FormControlLabel,
  FormHelperText,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { type ChangeEvent } from "react";
import { useDinov2Status } from "../../_helpers/useDinov2Status";
import { type Rule } from "../../_helpers/validation";
import { Dinov2Status } from "../../types";
import { ImageComparison } from "../../types/imageComparison";
import { useProjectState } from "../../contexts";
import { ValidatedTextField } from "../ValidatedForm";
import { POSITIVE_RULES, UNIT_RANGE, UNIT_RANGE_RULES } from "./rules";
import { useNoiseConfig } from "./useNoiseConfig";

const statusNote = (
  status: Dinov2Status | undefined,
): { text: string; warning?: boolean } | undefined => {
  if (status === undefined) {
    return undefined;
  }
  if (!status.configured) {
    return {
      text: "Not available: this server has no DINOv2 service (DINOV2_URL). Runs are judged by the blur stage alone.",
    };
  }
  if (!status.available) {
    return {
      text: "The DINOv2 service is not answering right now. Until it does, runs are judged by the blur stage alone.",
      warning: true,
    };
  }
  return undefined;
};

interface NumberFieldProps {
  name: string;
  label: string;
  helperText?: string;
  value: number | null;
  step: number;
  rules: readonly Rule[];
  min?: number;
  max?: number;
  disabled: boolean;
  onChange: (value: number) => void;
}

const NumberField = ({
  name,
  label,
  helperText,
  value,
  step,
  rules,
  min,
  max,
  disabled,
  onChange,
}: NumberFieldProps) => (
  <ValidatedTextField
    name={name}
    rules={rules}
    slotProps={{ htmlInput: { min, max, step } }}
    margin="dense"
    id={name}
    label={label}
    helperText={helperText}
    type="number"
    fullWidth
    required
    disabled={disabled}
    value={value ?? ""}
    onChange={(event: ChangeEvent<HTMLInputElement>) =>
      onChange(parseFloat(event.target.value))
    }
  />
);

export const PostAnalysisForm = () => {
  const { projectEditState: project } = useProjectState();
  const [config, updateConfig] = useNoiseConfig();
  const status = useDinov2Status();
  const note = statusNote(status);

  const sectionOff = project.imageComparison === ImageComparison.vlm;
  const stageOneOff = sectionOff || !config.blur.enabled;
  const stageTwoOff = stageOneOff || !config.dinov2.enabled;

  return (
    <Stack component="section" aria-labelledby="postAnalysisTitle" spacing={1}>
      <Typography id="postAnalysisTitle" variant="h6" component="h3">
        Post-analysis
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Rendering-noise check — on request, marks unresolved runs that look like
        rendering noise. A hint, it never approves anything
      </Typography>
      {sectionOff && (
        <FormHelperText id="postAnalysisVlm">
          Not available with the VLM comparator
        </FormHelperText>
      )}

      <Typography variant="subtitle2" component="h4">
        Stage 1 · Blur
      </Typography>
      <FormControlLabel
        label="Blurred difference and change density. Cheap, runs on this server. Catches 92 of 120 bugs on our benchmark with the default thresholds, 0 false alarms"
        disabled={sectionOff}
        control={
          <Switch
            checked={config.blur.enabled}
            onChange={(_event, checked) =>
              updateConfig("blur", "enabled", checked)
            }
            color="primary"
            name="blurEnabled"
          />
        }
      />
      <NumberField
        name="blurAmplitudeThreshold"
        label="Amplitude threshold"
        helperText="Noise on our benchmark stays below 51"
        value={config.blur.amplitudeThreshold}
        step={1}
        rules={POSITIVE_RULES}
        disabled={stageOneOff}
        onChange={(value) => updateConfig("blur", "amplitudeThreshold", value)}
      />
      <NumberField
        name="blurSolidShareMax"
        label="Solid share, max"
        value={config.blur.solidShareMax}
        step={0.001}
        rules={UNIT_RANGE_RULES}
        {...UNIT_RANGE}
        disabled={stageOneOff}
        onChange={(value) => updateConfig("blur", "solidShareMax", value)}
      />

      <Typography variant="subtitle2" component="h4">
        Stage 2 · DINOv2 second look
      </Typography>
      <FormControlLabel
        label="Asks the DINOv2 service about patches the blur calls noise. Catches faint icons and borders, 102 of 120 together"
        disabled={stageOneOff}
        control={
          <Switch
            checked={config.dinov2.enabled}
            onChange={(_event, checked) =>
              updateConfig("dinov2", "enabled", checked)
            }
            color="primary"
            name="dinov2Enabled"
          />
        }
      />
      {!sectionOff && !config.blur.enabled && (
        <FormHelperText>Needs stage 1</FormHelperText>
      )}
      <NumberField
        name="dinov2DistanceThreshold"
        label="Distance threshold"
        value={config.dinov2.distanceThreshold}
        step={0.01}
        rules={POSITIVE_RULES}
        disabled={stageTwoOff}
        onChange={(value) => updateConfig("dinov2", "distanceThreshold", value)}
      />
      {note && (
        <FormHelperText
          id="dinov2Status"
          sx={note.warning ? { color: "warning.main" } : undefined}
        >
          {note.text}
        </FormHelperText>
      )}
    </Stack>
  );
};
