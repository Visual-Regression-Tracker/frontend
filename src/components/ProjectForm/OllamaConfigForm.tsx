import {
  useState,
  useEffect,
  useMemo,
  type ChangeEvent,
  Fragment,
} from "react";
import {
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectChangeEvent,
} from "@mui/material";
import { TextValidator } from "react-material-ui-form-validator";
import { useSnackbar } from "notistack";
import { OllamaVlmConfig } from "../../types/imageComparison";
import { Tooltip } from "../Tooltip";
import { useConfigHook } from "./useConfigHook";
import { ollamaService } from "../../services";
import { OllamaModel } from "../../types";
import { VlmSharedFields } from "./VlmSharedFields";

export const OllamaConfigForm = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [config, updateConfig] = useConfigHook<OllamaVlmConfig>();
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

  const renderModelField = () => {
    if (loading || models.length === 0) {
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
          disabled={loading}
          helperText={
            loading
              ? "Loading models..."
              : "No models available. Enter model name manually."
          }
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            updateConfig("model", event.target.value);
          }}
        />
      );
    }

    return (
      <FormControl
        variant="standard"
        fullWidth
        margin="dense"
        error={hasError}
        required
      >
        <InputLabel id="model-select-label">Model</InputLabel>
        <Select
          labelId="model-select-label"
          id="model-select"
          value={config.model || ""}
          onChange={(event: SelectChangeEvent<string>) =>
            updateConfig("model", event.target.value)
          }
          name="model"
        >
          {models.map((model) => (
            <MenuItem key={model.name} value={model.name}>
              {model.name}
            </MenuItem>
          ))}
        </Select>
        {hasError && (
          <FormHelperText>
            Selected model is not in the available list.
          </FormHelperText>
        )}
      </FormControl>
    );
  };

  return (
    <Fragment>
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
      <VlmSharedFields />
    </Fragment>
  );
};
