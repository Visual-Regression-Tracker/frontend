import { FormHelperText } from "@mui/material";
import { useDinov2Status } from "../../_helpers/useDinov2Status";
import { Dinov2Status } from "../../types";
import { ImageComparison } from "../../types/imageComparison";
import { useProjectState } from "../../contexts";
import { SettingsSection, ToggleRow } from "./SettingsRow";
import { useNoiseConfig } from "./useNoiseConfig";
import { ELEMENT_ID } from "../../constants/locators";

const statusNote = (
  status: Dinov2Status | undefined,
): { text: string; warning?: boolean } | undefined => {
  if (status === undefined) {
    return undefined;
  }
  if (!status.configured) {
    return {
      text: "Not available: this server has no DINOv2 service (DINOV2_URL). Runs are judged by the blur stage alone.",
    };
  }
  if (!status.available) {
    return {
      text: "The DINOv2 service is not answering right now. Until it does, runs are judged by the blur stage alone.",
      warning: true,
    };
  }
  return undefined;
};

export const PostAnalysisForm = () => {
  const { projectEditState: project } = useProjectState();
  const [config, setEnabled] = useNoiseConfig();
  const status = useDinov2Status();
  const note = statusNote(status);

  const sectionOff = project.imageComparison === ImageComparison.vlm;
  const stageOneOff = sectionOff || !config.blur.enabled;
  const noService = status?.configured === false;

  return (
    <SettingsSection
      id="post-analysis"
      title="Post-analysis"
      description={
        <>
          Rendering-noise check — on request, marks unresolved runs that look
          like rendering noise. A hint, it never approves anything
          {sectionOff && (
            <FormHelperText id={ELEMENT_ID.postAnalysisVlm}>
              Not available with the VLM comparator
            </FormHelperText>
          )}
        </>
      }
    >
      <ToggleRow
        title="Stage 1 · Blur"
        description="Blurred difference and change density. Cheap, runs on this server. Catches 92 of 120 bugs on our benchmark, 0 false alarms"
        name="blurEnabled"
        checked={config.blur.enabled}
        disabled={sectionOff}
        onChange={(checked) => setEnabled("blur", checked)}
      />

      <ToggleRow
        title="Stage 2 · DINOv2 second look"
        description={
          <>
            Asks the DINOv2 service about patches the blur calls noise. Catches
            faint icons and borders, 102 of 120 together
            {!sectionOff && !config.blur.enabled && (
              <FormHelperText>Needs stage 1</FormHelperText>
            )}
            {note && (
              <FormHelperText
                id={ELEMENT_ID.dinov2Status}
                sx={note.warning ? { color: "warning.main" } : undefined}
              >
                {note.text}
              </FormHelperText>
            )}
          </>
        }
        name="dinov2Enabled"
        checked={config.dinov2.enabled}
        disabled={stageOneOff || noService}
        onChange={(checked) => setEnabled("dinov2", checked)}
      />
    </SettingsSection>
  );
};
