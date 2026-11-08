import { Checkbox, FormControlLabel, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { thumbnailFor } from "../../_helpers/testRunImage.helper";
import { TestRun } from "../../types";
import { imageSurface } from "../../theme/tokens";

const Card = styled("div", {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected?: boolean }>(({ theme, selected }) => ({
  border: `1px solid ${theme.vars?.palette.divider}`,
  borderRadius: 6,
  padding: 6,
  ...(selected && {
    borderColor: theme.vars?.palette.primary.main,
    boxShadow: `0 0 0 1px ${theme.vars?.palette.primary.main}`,
  }),
}));

const CardHead = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const Thumb = styled("img")({
  display: "block",
  width: "100%",
  height: 220,
  objectFit: "contain",
  background: imageSurface.thumbnail,
});

const ThumbButton = styled("button")({
  display: "block",
  width: "100%",
  padding: 0,
  border: "none",
  background: "none",
  cursor: "zoom-in",
});

export const Grid = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
  gap: 12,
});

export const Toolbar = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 12,
});

export const Loading = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 48,
});

export const MatchingVariationCard = ({
  run,
  label,
  selected,
  showDiff,
  reason,
  onToggle,
  onOpen,
}: {
  run: TestRun;
  label: string;
  selected: boolean;
  showDiff: boolean;
  reason?: string;
  onToggle: () => void;
  onOpen: () => void;
}) => (
  <Card selected={selected}>
    <CardHead>
      <FormControlLabel
        sx={{ minWidth: 0, marginLeft: 0, marginRight: "4px" }}
        control={
          <Checkbox checked={selected} onChange={onToggle} size="small" />
        }
        label={
          <Typography variant="caption" noWrap>
            {label}
          </Typography>
        }
      />
      <Typography variant="caption" color="textSecondary">
        {(run.diffPercent ?? 0).toFixed(1)}%
      </Typography>
    </CardHead>
    <ThumbButton
      type="button"
      onClick={onOpen}
      aria-label={`View ${label} full size`}
    >
      <Thumb
        src={thumbnailFor(run, showDiff)}
        alt={run.customTags}
        loading="lazy"
      />
    </ThumbButton>
    {reason && (
      <Typography variant="caption" align="center" sx={{ display: "block" }}>
        {reason}
      </Typography>
    )}
  </Card>
);
