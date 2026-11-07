import { type ChangeEvent, Fragment } from "react";
import { ValidatedTextField } from "../ValidatedForm";
import { PixelmatchConfig } from "../../types/imageComparison";
import { FieldRow, ToggleRow } from "./SettingsRow";
import { useConfigHook } from "./useConfigHook";
import { UNIT_RANGE, UNIT_RANGE_RULES } from "./rules";

export const PixelmatchConfigForm = () => {
  const [config, updateConfig] = useConfigHook<PixelmatchConfig>();

  return (
    <Fragment>
      <ToggleRow
        title="Allow diff dimensions"
        description="Enable comparison of images with different sizes."
        name="diffDimensionsFeature"
        checked={config.allowDiffDimensions}
        onChange={(checked) => updateConfig("allowDiffDimensions", checked)}
      />
      <ToggleRow
        title="Ignore anti-aliasing"
        description="Ignore detecting and ignoring anti-aliased pixels."
        name="ignoreAntialiasing"
        checked={config.ignoreAntialiasing}
        onChange={(checked) => updateConfig("ignoreAntialiasing", checked)}
      />
      <FieldRow
        id="threshold"
        title="Pixel diff threshold"
        required
        description="The threshold of how much a pixel can deviate until it is detected as change (0-1)."
        width={120}
      >
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
