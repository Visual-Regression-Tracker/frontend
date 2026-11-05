import { type ChangeEvent, Fragment } from "react";
import { ValidatedTextField } from "../ValidatedForm";
import { required } from "../../_helpers/validation";
import { FieldRow, ToggleRow } from "./SettingsRow";
import { VlmConfig } from "../../types/imageComparison";
import { useConfigHook } from "./useConfigHook";
import { UNIT_RANGE, UNIT_RANGE_RULES } from "./rules";

const PROMPT_RULES = [required("Prompt is required")];

const VlmPromptField = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <FieldRow
    id="prompt"
    title="Prompt"
    description="The prompt text that will be sent to the VLM to analyze image differences."
    stacked
  >
    <ValidatedTextField
      name="prompt"
      rules={PROMPT_RULES}
      id="prompt"
      size="small"
      type="text"
      multiline
      rows={4}
      fullWidth
      required
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.value);
      }}
    />
  </FieldRow>
);

const VlmTemperatureField = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => (
  <FieldRow
    id="temperature"
    title="Temperature"
    description="Controls the randomness of the VLM response (0-1). Lower values (0-0.3) produce more consistent results, higher values (0.7-1) produce more creative responses."
    width={120}
  >
    <ValidatedTextField
      name="temperature"
      rules={UNIT_RANGE_RULES}
      slotProps={{
        htmlInput: { ...UNIT_RANGE, step: 0.01 },
      }}
      id="temperature"
      size="small"
      type="number"
      fullWidth
      required
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        const { value: inputValue } = event.target;
        onChange(Number.parseFloat(inputValue));
      }}
    />
  </FieldRow>
);

export const VlmSharedFields = () => {
  const [config, updateConfig] = useConfigHook<VlmConfig>();
  return (
    <Fragment>
      <VlmPromptField
        value={config.prompt}
        onChange={(value) => updateConfig("prompt", value)}
      />
      <VlmTemperatureField
        value={config.temperature}
        onChange={(value) => updateConfig("temperature", value)}
      />
      <ToggleRow
        title="Use Thinking"
        description="Enable thinking mode for the VLM model."
        name="useThinking"
        checked={config.useThinking || false}
        onChange={(value) => updateConfig("useThinking", value)}
      />
    </Fragment>
  );
};
