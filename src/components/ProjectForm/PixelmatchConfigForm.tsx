import { FormControlLabel, Switch } from "@material-ui/core";
import React from "react";
import { TextValidator } from "react-material-ui-form-validator";
import {
  useProjectState,
  useProjectDispatch,
  setProjectEditState,
} from "../../contexts";
import { PixelmatchConfig } from "../../types/imageComparison";
import { modifyConfigProp, parseImageComparisonConfig } from "./utils";

export const PixelmatchConfigForm: React.FunctionComponent = () => {
  const { projectEditState: project } = useProjectState();
  const projectDispatch = useProjectDispatch();

  const config: PixelmatchConfig = React.useMemo(
    () =>
      parseImageComparisonConfig<PixelmatchConfig>(
        project.imageComparisonConfig
      ),
    [project.imageComparisonConfig]
  );

  const updateConfig = React.useCallback(
    (name: keyof PixelmatchConfig, value: PixelmatchConfig[typeof name]) => {
      const imageComparisonConfig = modifyConfigProp<PixelmatchConfig>(
        project.imageComparisonConfig,
        name,
        value
      );
      setProjectEditState(projectDispatch, {
        ...project,
        imageComparisonConfig,
      });
    },
    [projectDispatch, project]
  );

  return (
    <React.Fragment>
      <FormControlLabel
        label="Allow diff dimentions"
        control={
          <Switch
            checked={config.allowDiffDimensions}
            onChange={(event, checked) =>
              updateConfig("allowDiffDimensions", checked)
            }
            color="primary"
            name="diffDimensionsFeature"
          />
        }
      />
      <FormControlLabel
        label="Ignore anti-alliasing"
        control={
          <Switch
            checked={config.ignoreAntialiasing}
            onChange={(event, checked) =>
              updateConfig("ignoreAntialiasing", checked)
            }
            color="primary"
            name="ignoreAntialiasing"
          />
        }
      />
      <TextValidator
        name="threshold"
        validators={["minNumber:0", "maxNumber:1"]}
        errorMessages={["Enter greater than 0", "Enter less than 1"]}
        InputProps={{ inputProps: { min: 0, max: 1, step: 0.001 } }}
        margin="dense"
        id="threshold"
        label="Pixel diff threshold"
        type="number"
        fullWidth
        required
        value={config.threshold}
        onChange={(event) => {
          const value = (event.target as HTMLInputElement).value;
          updateConfig("threshold", parseFloat(value));
        }}
      />
    </React.Fragment>
  );
};
