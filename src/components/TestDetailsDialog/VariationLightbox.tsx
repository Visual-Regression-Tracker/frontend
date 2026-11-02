import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  Typography,
} from "@mui/material";
// named imports: per-icon default imports resolve to module objects in the prod bundle
import {
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { Tooltip } from "../Tooltip";
import { staticService } from "../../services";
import { imageFor } from "../../_helpers/testRunImage.helper";
import { TestRun } from "../../types";
import { imageSurface } from "../../theme/tokens";

const Meta = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  padding: "4px 8px 8px",
});

const LightboxRow = styled("div")({
  display: "flex",
  gap: 12,
});

const LightboxHalf = styled("div")({
  flex: 1,
  minWidth: 0,
  textAlign: "center",
});

const LightboxImg = styled("img")({
  maxWidth: "100%",
  maxHeight: "74vh",
  objectFit: "contain",
  verticalAlign: "top",
  background: imageSurface.thumbnail,
});

export interface LightboxPreview {
  index: number;
  showDiff: boolean;
}

interface VariationLightboxProps {
  runs: TestRun[];
  preview: LightboxPreview | null;
  onStep: (delta: number) => void;
  onShowDiffChange: (showDiff: boolean) => void;
  onClose: () => void;
}

export const VariationLightbox = ({
  runs,
  preview,
  onStep,
  onShowDiffChange,
  onClose,
}: VariationLightboxProps) => {
  const run = preview ? runs[preview.index] : undefined;

  return (
    <Dialog open={!!run} onClose={onClose} maxWidth="xl" fullWidth>
      {preview && run && (
        <>
          <DialogTitle>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box display="flex" alignItems="center">
                <IconButton
                  onClick={() => onStep(-1)}
                  disabled={preview.index === 0}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton
                  onClick={() => onStep(1)}
                  disabled={preview.index === runs.length - 1}
                >
                  <ChevronRightIcon />
                </IconButton>
                <span>
                  {run.name} ({preview.index + 1}/{runs.length})
                </span>
              </Box>
              <Box display="flex" alignItems="center">
                <Tooltip title="Toggle diff. Hotkey: D">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preview.showDiff}
                        onChange={(e) => onShowDiffChange(e.target.checked)}
                      />
                    }
                    label="Show diff"
                  />
                </Tooltip>
                <IconButton onClick={onClose}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          </DialogTitle>
          <Meta>
            <Typography variant="caption">OS: {run.os || "—"}</Typography>
            <Typography variant="caption">
              Device: {run.device || "—"}
            </Typography>
            <Typography variant="caption">
              Custom Tags: {run.customTags || "—"}
            </Typography>
            <Typography variant="caption">
              Diff: {(run.diffPercent ?? 0).toFixed(2)}%
            </Typography>
            <Typography variant="caption">
              Diff tolerance: {run.diffTollerancePercent ?? 0}%
            </Typography>
          </Meta>
          <DialogContent dividers>
            <LightboxRow>
              <LightboxHalf>
                <LightboxImg
                  src={staticService.getImage(run.baselineName)}
                  alt="baseline"
                />
              </LightboxHalf>
              <LightboxHalf>
                <LightboxImg
                  src={imageFor(run, preview.showDiff)}
                  alt="checkpoint"
                />
              </LightboxHalf>
            </LightboxRow>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
};
