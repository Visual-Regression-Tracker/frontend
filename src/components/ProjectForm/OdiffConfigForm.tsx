import { type ChangeEvent, Fragment } from "react";
import { ValidatedTextField } from "../ValidatedForm";
import { OdiffConfig } from "../../types/imageComparison";
import { FieldRow, ToggleRow } from "./SettingsRow";
import { useConfigHook } from "./useConfigHook";
import { UNIT_RANGE, UNIT_RANGE_RULES } from "./rules";

export const OdiffConfigForm = () => {
  const [config, updateConfig] = useConfigHook<OdiffConfig>();

  return (
    <Fragment>
      <ToggleRow
        title="Output diff mask"
        name="outputDiffMask"
        checked={config.outputDiffMask}
        onChange={(checked) => updateConfig("outputDiffMask", checked)}
      />
      <ToggleRow
        title="Fail on layout diff"
        name="failOnLayoutDiff"
        checked={config.failOnLayoutDiff}
        onChange={(checked) => updateConfig("failOnLayoutDiff", checked)}
      />
      <ToggleRow
        title="Ignore anti-aliasing"
        name="antialiasing"
        checked={config.antialiasing}
        onChange={(checked) => updateConfig("antialiasing", checked)}
      />
      <FieldRow id="threshold" title="Pixel diff threshold" width={120}>
        <ValidatedTextField
          name="threshold"
          rules={UNIT_RANGE_RULES}
          slotProps={{
            htmlInput: { ...UNIT_RANGE, step: 0.001 },
          }}
          size="small"
          id="threshold"
          type="number"
          fullWidth
          required
          value={config.threshold}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const { value } = event.target;
            updateConfig("threshold", parseFloat(value));
          }}
        />
      </FieldRow>
    </Fragment>
  );
};
