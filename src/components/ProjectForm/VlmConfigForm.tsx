import React, { useMemo } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { VlmConfig } from "../../types/imageComparison";
import { useConfigHook } from "./useConfigHook";
import {
  useProjectState,
  useProjectDispatch,
  setProjectEditState,
} from "../../contexts";
import { GeminiConfigForm } from "./GeminiConfigForm";
import { OllamaConfigForm } from "./OllamaConfigForm";

export const VlmConfigForm: React.FunctionComponent = () => {
  const [config] = useConfigHook<VlmConfig>();
  const { projectEditState: project } = useProjectState();
  const projectDispatch = useProjectDispatch();

  // Determine current provider (default to ollama if not set)
  const currentProvider = useMemo(() => {
    if ("provider" in config && config.provider === "gemini") {
      return "gemini";
    }
    return "ollama";
  }, [config]);

  const handleProviderChange = (event: SelectChangeEvent<string>) => {
    const newProvider = event.target.value as "ollama" | "gemini";
    const currentPrompt = config.prompt;
    const currentTemperature = config.temperature;
    const currentUseThinking = config.useThinking;

    // We need to update the entire config when switching providers
    let newConfig: VlmConfig;
    if (newProvider === "gemini") {
      newConfig = {
        provider: "gemini",
        model: "gemini-1.5-pro",
        apiKey: "",
        prompt: currentPrompt,
        temperature: currentTemperature,
        useThinking: currentUseThinking,
      };
    } else {
      newConfig = {
        provider: "ollama",
        model: "",
        prompt: currentPrompt,
        temperature: currentTemperature,
        useThinking: currentUseThinking,
      };
    }

    setProjectEditState(projectDispatch, {
      ...project,
      imageComparisonConfig: JSON.stringify(newConfig),
    });
  };

  return (
    <React.Fragment>
      <FormControl variant="standard" fullWidth margin="dense" required>
        <InputLabel id="provider-select-label">VLM Provider</InputLabel>
        <Select
          labelId="provider-select-label"
          id="provider-select"
          value={currentProvider}
          onChange={handleProviderChange}
          name="provider"
        >
          <MenuItem value="ollama">Ollama</MenuItem>
          <MenuItem value="gemini">Google Gemini</MenuItem>
        </Select>
      </FormControl>
      {currentProvider === "gemini" ? (
        <GeminiConfigForm />
      ) : (
        <OllamaConfigForm />
      )}
    </React.Fragment>
  );
};
