import React from "react";
import { FormControlLabel, Switch } from "@mui/material";
import { TextValidator } from "react-material-ui-form-validator";
import { Tooltip } from "../Tooltip";

interface VlmSharedFieldsProps {
  prompt: string;
  temperature: number;
  useThinking: boolean;
  onPromptChange: (value: string) => void;
  onTemperatureChange: (value: number) => void;
  onUseThinkingChange: (value: boolean) => void;
}

export const VlmPromptField: React.FunctionComponent<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  return (
    <Tooltip title="The prompt text that will be sent to the VLM to analyze image differences.">
      <div>
        <TextValidator
          name="prompt"
          validators={["required"]}
          errorMessages={["Prompt is required"]}
          margin="dense"
          id="prompt"
          label="Prompt"
          type="text"
          multiline
          rows={4}
          fullWidth
          required
          value={value}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            onChange(event.target.value);
          }}
        />
      </div>
    </Tooltip>
  );
};

export const VlmTemperatureField: React.FunctionComponent<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => {
  return (
    <Tooltip title="Controls the randomness of the VLM response. Lower values (0-0.3) produce more consistent results, higher values (0.7-1) produce more creative responses.">
      <div>
        <TextValidator
          name="temperature"
          validators={["minNumber:0", "maxNumber:1"]}
          errorMessages={[
            "Enter greater than or equal to 0",
            "Enter less than or equal to 1",
          ]}
          InputProps={{
            inputProps: {
              min: 0,
              max: 1,
              step: 0.01,
            },
          }}
          margin="dense"
          id="temperature"
          label="Temperature"
          helperText="Controls response randomness (0-1). Lower values are more consistent."
          type="number"
          fullWidth
          required
          value={value}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const { value: inputValue } = event.target;
            onChange(Number.parseFloat(inputValue));
          }}
        />
      </div>
    </Tooltip>
  );
};

export const VlmUseThinkingField: React.FunctionComponent<{
  value: boolean;
  onChange: (value: boolean) => void;
}> = ({ value, onChange }) => {
  return (
    <Tooltip title="Enable thinking mode for the VLM model.">
      <FormControlLabel
        label="Use Thinking"
        control={
          <Switch
            checked={value || false}
            onChange={(event, checked) => onChange(checked)}
            color="primary"
            name="useThinking"
          />
        }
      />
    </Tooltip>
  );
};
