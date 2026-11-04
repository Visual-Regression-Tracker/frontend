import { FormControlLabel, Switch } from "@mui/material";
import { type ChangeEvent, Fragment } from "react";
import { ValidatedTextField } from "../ValidatedForm";
import { LooksSameConfig } from "../../types/imageComparison";
import { useConfigHook } from "./useConfigHook";
import { atLeast } from "./rules";

const LOWEST_TOLERANCE = 0;
const TOLERANCE_RULES = [atLeast(LOWEST_TOLERANCE)];

export const LooksSameConfigForm = () => {
  const [config, updateConfig] = useConfigHook<LooksSameConfig>();

  return (
    <Fragment>
      <FormControlLabel
        label="Strict"
        control={
          <Switch
            checked={config.strict}
            onChange={(_event, checked) => updateConfig("strict", checked)}
            color="primary"
            name="strict"
          />
        }
      />
      <ValidatedTextField
        name="tolerance"
        rules={TOLERANCE_RULES}
        slotProps={{
          htmlInput: { min: LOWEST_TOLERANCE, step: 0.001 },
        }}
        margin="dense"
        id="tolerance"
        label="Tolerance"
        type="number"
        fullWidth
        helperText="Default tolerance in non-strict mode is 2.3 which is enough for the most cases. Setting tolerance to 0 will produce the same result as strict: true, but strict mode is faster. Attempt to set tolerance in strict mode will produce an error."
        value={config.tolerance}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const { value } = event.target;
          updateConfig("tolerance", parseFloat(value));
        }}
      />
      <FormControlLabel
        label="Ignore anti-alliasing"
        control={
          <Switch
            checked={config.ignoreAntialiasing}
            onChange={(_event, checked) =>
              updateConfig("ignoreAntialiasing", checked)
            }
            color="primary"
            name="ignoreAntialiasing"
          />
        }
      />
      <ValidatedTextField
        name="antialiasingTolerance"
        rules={TOLERANCE_RULES}
        slotProps={{
          htmlInput: { min: LOWEST_TOLERANCE, step: 0.001 },
        }}
        margin="dense"
        id="antialiasingTolerance"
        label="Antialiasing tolerance"
        type="number"
        fullWidth
        helperText="Minimum difference in brightness (zero by default) between the darkest/lightest pixel (which is adjacent to the antialiasing pixel) and theirs adjacent pixels."
        value={config.antialiasingTolerance}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const { value } = event.target;
          updateConfig("antialiasingTolerance", parseFloat(value));
        }}
      />
      <FormControlLabel
        label="Ignore carret"
        control={
          <Switch
            checked={config.ignoreCaret}
            onChange={(_event, checked) => updateConfig("ignoreCaret", checked)}
            color="primary"
            name="ignoreCaret"
          />
        }
      />
      <FormControlLabel
        label="Allow diff dimensions"
        control={
          <Switch
            checked={config.allowDiffDimensions}
            onChange={(_event, checked) =>
              updateConfig("allowDiffDimensions", checked)
            }
            color="primary"
            name="diffDimensionsFeature"
          />
        }
      />
    </Fragment>
  );
};
