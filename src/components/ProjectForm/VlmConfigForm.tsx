import React, { useState, useEffect, useMemo } from "react";
import { LinearProgress, FormControl, InputLabel, Select, MenuItem, FormHelperText, SelectChangeEvent, FormControlLabel, Switch } from "@mui/material";
import { TextValidator } from "react-material-ui-form-validator";
import { useSnackbar } from "notistack";
import { VlmConfig } from "../../types/imageComparison";
import { Tooltip } from "../Tooltip";
import { useConfigHook } from "./useConfigHook";
import { ollamaService } from "../../services";
import { OllamaModel } from "../../types";

export const VlmConfigForm: React.FunctionComponent = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [config, updateConfig] = useConfigHook<VlmConfig>();
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    ollamaService
      .listModels()
      .then((fetchedModels) => {
        if (isMounted) {
          setModels(fetchedModels);
        }
      })
      .catch((err) => {
        if (isMounted) {
          enqueueSnackbar(err, {
            variant: "error",
          });
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [enqueueSnackbar]);

  const hasError = useMemo(() => {
    if (!config.model || loading || models.length === 0) {
      return false;
    }
    return !models.some((m) => m.name === config.model);
  }, [config.model, models, loading]);

  const handleModelChange = (event: SelectChangeEvent<string>) => {
    updateConfig("model", event.target.value);
  };

  const renderModelField = () => {
    if (loading) {
      return (
        <TextValidator
          name="model"
          validators={["required"]}
          errorMessages={["Model is required"]}
          margin="dense"
          id="model"
          label="Model"
          type="text"
          fullWidth
          required
          value={config.model || ""}
          disabled
          helperText="Loading models..."
        />
      );
    }

    if (models.length === 0) {
      return (
        <TextValidator
          name="model"
          validators={["required"]}
          errorMessages={["Model is required"]}
          margin="dense"
          id="model"
          label="Model"
          type="text"
          fullWidth
          required
          value={config.model || ""}
          helperText="No models available. Enter model name manually."
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            updateConfig("model", event.target.value);
          }}
        />
      );
    }

    return (
      <FormControl variant="standard" fullWidth margin="dense" error={hasError} required>
        <InputLabel id="model-select-label">Model</InputLabel>
        <Select
          labelId="model-select-label"
          id="model-select"
          value={config.model || ""}
          onChange={handleModelChange}
          name="model"
        >
          {models.map((model) => (
            <MenuItem key={model.name} value={model.name}>
              {model.name}
            </MenuItem>
          ))}
        </Select>
        {hasError && (
          <FormHelperText>Selected model is not in the available list.</FormHelperText>
        )}
      </FormControl>
    );
  };

  return (
    <React.Fragment>
      <Tooltip title="The Ollama model name to use for image comparison. Models are fetched from the Ollama service.">
        <div>
          {renderModelField()}
          <TextValidator
            name="model"
            validators={["required"]}
            errorMessages={["Model is required"]}
            value={config.model || ""}
            style={{ display: "none" }}
          />
        </div>
      </Tooltip>
      {loading && <LinearProgress />}
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
            errorMessages={["Enter greater than or equal to 0", "Enter less than or equal to 1"]}
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
              updateConfig("temperature", parseFloat(value));
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

