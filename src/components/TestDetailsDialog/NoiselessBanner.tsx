import { Alert, AlertTitle, Box, Button, LinearProgress } from "@mui/material";
import type { NoiselessCaveat } from "../../_helpers/noiseRegions.helper";
import { UNAVAILABLE_HINT, type NoiselessView } from "./useNoiselessDiff";
import { TEST_ID } from "../../constants/locators";

interface NoiselessBannerProps {
  view: NoiselessView;
  caveat: NoiselessCaveat;
  outlined: number;
  onSwitchToDiff: () => void;
}

const caveatText = (caveat: NonNullable<NoiselessCaveat>, outlined: number) =>
  caveat.kind === "dinov2 disagrees"
    ? {
        severity: "warning" as const,
        title: "DINOv2 sees a change this view hides.",
        detail:
          `Blur: noise-like · DINOv2: likely change, ${caveat.patches} patches` +
          (outlined ? ` (${outlined} strongest outlined)` : ""),
      }
    : {
        severity: "info" as const,
        title: "Faint changes may be hidden.",
        detail:
          "DINOv2 has not checked this run, and the blur stage alone drops faint changes.",
      };

export const NoiselessBanner = ({
  view,
  caveat,
  outlined,
  onSwitchToDiff,
}: NoiselessBannerProps) => {
  const switchToDiff = (
    <Button color="inherit" size="small" onClick={onSwitchToDiff}>
      Switch to Diff
    </Button>
  );

  if (view.status === "unavailable" || view.status === "failed") {
    return (
      <Alert
        severity={view.status === "failed" ? "error" : "info"}
        action={switchToDiff}
        sx={{ mx: 1, my: 0.5, py: 0 }}
      >
        {view.status === "failed"
          ? `Cannot show Diff without noise: ${view.message}`
          : `Diff without noise: ${UNAVAILABLE_HINT[view.reason].toLowerCase()}.`}
      </Alert>
    );
  }

  const text = caveat && caveatText(caveat, outlined);
  return (
    <Box sx={{ mx: 1 }}>
      {view.status === "computing" && (
        <LinearProgress aria-label="Computing Diff without noise" />
      )}
      {text && (
        <Alert
          severity={text.severity}
          action={switchToDiff}
          data-testid={TEST_ID.noiselessCaveat}
          sx={{ my: 0.5, py: 0 }}
        >
          <AlertTitle sx={{ mb: 0 }}>{text.title}</AlertTitle>
          {text.detail}
        </Alert>
      )}
    </Box>
  );
};
