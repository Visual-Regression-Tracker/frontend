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
  TextField,
} from "@mui/material";
import { useFieldValidation } from "../ValidatedForm";
import { useSnackbar } from "notistack";
import { OllamaVlmConfig } from "../../types/imageComparison";
import { Tooltip } from "../Tooltip";
import { useConfigHook } from "./useConfigHook";
import { ollamaService } from "../../services";
import { OllamaModel } from "../../types";
import { VlmSharedFields } from "./VlmSharedFields";
import { MODEL_RULES } from "./rules";

export const OllamaConfigForm = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [config, updateConfig] = useConfigHook<OllamaVlmConfig>();
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const modelError = useFieldValidation(config.model || "", MODEL_RULES);

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

  const notListed = useMemo(() => {
    if (!config.model || loading || models.length === 0) {
      return false;
    }
    return !models.some((m) => m.name === config.model);
  }, [config.model, models, loading]);

  const selectHelp =
    modelError ??
    (notListed ? "Selected model is not in the available list." : undefined);

  const renderModelField = () => {
    if (loading || models.length === 0) {
      return (
        <TextField
          name="model"
          margin="dense"
          id="model"
          label="Model"
          type="text"
          fullWidth
          required
          value={config.model || ""}
          disabled={loading}
          error={modelError !== undefined}
          helperText={
            modelError ??
            (loading
              ? "Loading models..."
              : "No models available. Enter model name manually.")
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
        error={selectHelp !== undefined}
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
        {selectHelp && <FormHelperText>{selectHelp}</FormHelperText>}
      </FormControl>
    );
  };

  return (
    <Fragment>
      <Tooltip title="The Ollama model name to use for image comparison. Models are fetched from the Ollama service.">
        <div>{renderModelField()}</div>
      </Tooltip>
      {loading && <LinearProgress />}
      <VlmSharedFields />
    </Fragment>
  );
};
