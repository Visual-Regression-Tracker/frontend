import React from "react";
import {
  FormControlLabel,
  Switch,
  Link,
} from "@mui/material";
import { TextValidator } from "react-material-ui-form-validator";
import { GeminiVlmConfig } from "../../types/imageComparison";
import { Tooltip } from "../Tooltip";
import { useConfigHook } from "./useConfigHook";
import {
  useProjectState,
  useProjectDispatch,
  setProjectEditState,
} from "../../contexts";

export const GeminiConfigForm: React.FunctionComponent = () => {
  const [config, updateConfig] = useConfigHook<GeminiVlmConfig>();
  const { projectEditState: project } = useProjectState();
  const projectDispatch = useProjectDispatch();

  return (
    <React.Fragment>
      <Tooltip title="The Google Gemini model to use for image comparison.">
        <div>
          <TextValidator
            name="model"
            validators={["required"]}
            errorMessages={["Model is required"]}
            margin="dense"
            id="model"
            label="Gemini Model"
            type="text"
            fullWidth
            required
            value={config.model || ""}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              updateConfig("model", event.target.value);
            }}
            helperText={
              <span>
                Gemini model name.{" "}
                <Link
                  href="https://ai.google.dev/models/gemini"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  View all available models
                </Link>
              </span>
            }
          />
        </div>
      </Tooltip>
      <Tooltip title="Your Google Gemini API key. Get one from https://makersuite.google.com/app/apikey">
        <div>
          <TextValidator
            name="apiKey"
            validators={["required"]}
            errorMessages={["API key is required"]}
            margin="dense"
            id="apiKey"
            label="Gemini API Key"
            type="password"
            fullWidth
            required
            value={config.apiKey || ""}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const updatedConfig: GeminiVlmConfig = {
                ...config,
                apiKey: event.target.value,
              };
              setProjectEditState(projectDispatch, {
                ...project,
                imageComparisonConfig: JSON.stringify(updatedConfig),
              });
            }}
            helperText="Enter your Google Gemini API key"
          />
        </div>
      </Tooltip>
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
            value={config.prompt}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              updateConfig("prompt", event.target.value);
            }}
          />
        </div>
      </Tooltip>
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
            value={config.temperature}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const { value } = event.target;
              updateConfig("temperature", Number.parseFloat(value));
            }}
          />
        </div>
      </Tooltip>
      <Tooltip title="Enable thinking mode for the VLM model.">
        <FormControlLabel
          label="Use Thinking"
          control={
            <Switch
              checked={config.useThinking || false}
              onChange={(event, checked) =>
                updateConfig("useThinking", checked)
              }
              color="primary"
              name="useThinking"
            />
          }
        />
      </Tooltip>
    </React.Fragment>
  );
};

