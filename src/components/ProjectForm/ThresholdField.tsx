import { type ChangeEvent } from "react";
import { TextValidator } from "react-material-ui-form-validator";
import { BlurAmplitudeConfig } from "../../types/imageComparison";
import { useConfigHook } from "./useConfigHook";

interface ThresholdFieldProps {
  field: "blurAmplitudeThreshold" | "dinov2Threshold";
  label: string;
  helperText: string;
  min: number;
  max: number;
  fallback: number;
}

export const ThresholdField = ({
  field,
  label,
  helperText,
  min,
  max,
  fallback,
}: ThresholdFieldProps) => {
  const [config, updateConfig] = useConfigHook<BlurAmplitudeConfig>();

  // absent: backend default; null: cleared, which the required validator refuses
  const value = config[field] === undefined ? fallback : (config[field] ?? "");

  return (
    <TextValidator
      name={field}
      // minNumber and maxNumber compare whole numbers, so fractional bounds need the float rules
      validators={["required", `minFloat:${min}`, `maxFloat:${max}`]}
      errorMessages={[
        "Enter a threshold",
        `Enter at least ${min}`,
        `Enter at most ${max}`,
      ]}
      slotProps={{
        htmlInput: {
          min,
          max,
          // fractions are valid; a whole step would make the browser refuse them
          step: "any",
        },
      }}
      margin="dense"
      id={field}
      label={label}
      helperText={helperText}
      type="number"
      fullWidth
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        const parsed = parseFloat(event.target.value);
        updateConfig(field, Number.isNaN(parsed) ? null : parsed);
      }}
    />
  );
};
