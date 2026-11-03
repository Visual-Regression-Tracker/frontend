import { type ChangeEvent, Fragment } from "react";
import { FormControlLabel, Switch } from "@mui/material";
import { ValidatedTextField } from "../ValidatedForm";
import { required } from "../../_helpers/validation";
import { Tooltip } from "../Tooltip";
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
}) => {
  return (
    <Tooltip title="The prompt text that will be sent to the VLM to analyze image differences.">
      <div>
        <ValidatedTextField
          name="prompt"
          rules={PROMPT_RULES}
          margin="dense"
          id="prompt"
          label="Prompt"
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
      </div>
    </Tooltip>
  );
};

const VlmTemperatureField = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => {
  return (
    <Tooltip title="Controls the randomness of the VLM response. Lower values (0-0.3) produce more consistent results, higher values (0.7-1) produce more creative responses.">
      <div>
        <ValidatedTextField
          name="temperature"
          rules={UNIT_RANGE_RULES}
          slotProps={{
            htmlInput: { ...UNIT_RANGE, step: 0.01 },
          }}
          margin="dense"
          id="temperature"
          label="Temperature"
          helperText="Controls response randomness (0-1). Lower values are more consistent."
          type="number"
          fullWidth
          required
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const { value: inputValue } = event.target;
            onChange(Number.parseFloat(inputValue));
          }}
        />
      </div>
    </Tooltip>
  );
};

const VlmUseThinkingField = ({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) => {
  return (
    <Tooltip title="Enable thinking mode for the VLM model.">
      <FormControlLabel
        label="Use Thinking"
        control={
          <Switch
            checked={value || false}
            onChange={(_event, checked) => onChange(checked)}
            color="primary"
            name="useThinking"
          />
        }
      />
    </Tooltip>
  );
};

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
      <VlmUseThinkingField
        value={config.useThinking || false}
        onChange={(value) => updateConfig("useThinking", value)}
      />
    </Fragment>
  );
};
