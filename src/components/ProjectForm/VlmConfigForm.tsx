import { Fragment } from "react";
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
import { BlurAmplitudeFields } from "./BlurAmplitudeFields";
import { withBlurAmplitudeOf } from "./utils";

export const VlmConfigForm = () => {
  const [config] = useConfigHook<VlmConfig>();
  const { projectEditState: project } = useProjectState();
  const projectDispatch = useProjectDispatch();

  const currentProvider = config.provider === "gemini" ? "gemini" : "ollama";

  const handleProviderChange = (event: SelectChangeEvent<string>) => {
    const newProvider = event.target.value as "ollama" | "gemini";
    const { prompt, temperature, useThinking } = config;
    const shared = { prompt, temperature, useThinking };
    const newConfig: VlmConfig =
      newProvider === "gemini"
        ? { provider: "gemini", model: "gemini-1.5-pro", apiKey: "", ...shared }
        : { provider: "ollama", model: "", ...shared };

    setProjectEditState(projectDispatch, {
      ...project,
      imageComparisonConfig: withBlurAmplitudeOf(
        JSON.stringify(newConfig),
        project.imageComparisonConfig,
      ),
    });
  };

  return (
    <Fragment>
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
      <BlurAmplitudeFields />
    </Fragment>
  );
};
