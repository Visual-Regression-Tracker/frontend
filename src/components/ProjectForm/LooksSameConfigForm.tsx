import { type ChangeEvent, Fragment } from "react";
import { ValidatedTextField } from "../ValidatedForm";
import { LooksSameConfig } from "../../types/imageComparison";
import { FieldRow, ToggleRow } from "./SettingsRow";
import { useConfigHook } from "./useConfigHook";
import { atLeast } from "./rules";

const LOWEST_TOLERANCE = 0;
const TOLERANCE_RULES = [atLeast(LOWEST_TOLERANCE)];

export const LooksSameConfigForm = () => {
  const [config, updateConfig] = useConfigHook<LooksSameConfig>();

  return (
    <Fragment>
      <ToggleRow
        title="Strict"
        name="strict"
        checked={config.strict}
        onChange={(checked) => updateConfig("strict", checked)}
      />
      <FieldRow
        id="tolerance"
        title="Tolerance"
        description="Default tolerance in non-strict mode is 2.3 which is enough for the most cases. Setting tolerance to 0 will produce the same result as strict: true, but strict mode is faster. Attempt to set tolerance in strict mode will produce an error."
        width={120}
      >
        <ValidatedTextField
          name="tolerance"
          rules={TOLERANCE_RULES}
          slotProps={{
            htmlInput: { min: LOWEST_TOLERANCE, step: 0.001 },
          }}
          size="small"
          id="tolerance"
          type="number"
          fullWidth
          value={config.tolerance}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const { value } = event.target;
            updateConfig("tolerance", parseFloat(value));
          }}
        />
      </FieldRow>
      <ToggleRow
        title="Ignore anti-aliasing"
        name="ignoreAntialiasing"
        checked={config.ignoreAntialiasing}
        onChange={(checked) => updateConfig("ignoreAntialiasing", checked)}
      />
      <FieldRow
        id="antialiasingTolerance"
        title="Antialiasing tolerance"
        description="Minimum difference in brightness (zero by default) between the darkest/lightest pixel (which is adjacent to the antialiasing pixel) and theirs adjacent pixels."
        width={120}
      >
        <ValidatedTextField
          name="antialiasingTolerance"
          rules={TOLERANCE_RULES}
          slotProps={{
            htmlInput: { min: LOWEST_TOLERANCE, step: 0.001 },
          }}
          size="small"
          id="antialiasingTolerance"
          type="number"
          fullWidth
          value={config.antialiasingTolerance}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const { value } = event.target;
            updateConfig("antialiasingTolerance", parseFloat(value));
          }}
        />
      </FieldRow>
      <ToggleRow
        title="Ignore caret"
        name="ignoreCaret"
        checked={config.ignoreCaret}
        onChange={(checked) => updateConfig("ignoreCaret", checked)}
      />
      <ToggleRow
        title="Allow diff dimensions"
        name="diffDimensionsFeature"
        checked={config.allowDiffDimensions}
        onChange={(checked) => updateConfig("allowDiffDimensions", checked)}
      />
    </Fragment>
  );
};
