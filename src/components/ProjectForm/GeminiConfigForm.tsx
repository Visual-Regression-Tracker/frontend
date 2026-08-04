import React from "react";
import { Link } from "@mui/material";
import { TextValidator } from "react-material-ui-form-validator";
import { GeminiVlmConfig } from "../../types/imageComparison";
import { Tooltip } from "../Tooltip";
import { useConfigHook } from "./useConfigHook";
import {
  VlmPromptField,
  VlmTemperatureField,
  VlmUseThinkingField,
} from "./VlmSharedFields";

export const GeminiConfigForm: React.FunctionComponent = () => {
  const [config, updateConfig] = useConfigHook<GeminiVlmConfig>();

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
              updateConfig("apiKey", event.target.value);
            }}
            helperText="Enter your Google Gemini API key"
          />
        </div>
      </Tooltip>
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
    </React.Fragment>
  );
};

