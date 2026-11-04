import { Fragment, type SyntheticEvent } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Chip,
  Typography,
} from "@mui/material";
import TestStatusChip from "../TestStatusChip";
import { NoiseHintChip } from "./NoiseHintChip";
import noImage from "../../static/no-image.png";
import { CARD_SIZE_BY_DENSITY, TestRunDensity } from "./TestRunListControls";
import {
  groupStatusSummary,
  TestRunGroup,
} from "../../_helpers/testRunGroup.helper";
import { thumbnailFor } from "../../_helpers/testRunImage.helper";
import { tagValuesOf } from "../../_helpers/testRunTags.helper";
import { TagField } from "../../types";

const clampToLines = (lines: number) => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: lines,
  overflow: "hidden",
  overflowWrap: "anywhere",
});

const CAPTION_LINE_HEIGHT = 1.66;

// inline so the row wraps; letter-spacing restated because a button resets it
const TAG_BUTTON = {
  display: "inline",
  font: "inherit",
  letterSpacing: "inherit",
  background: "none",
  border: 0,
  padding: 0,
  cursor: "pointer",
  "&:hover": { textDecoration: "underline" },
};

/** Block, not -webkit-box, so the tag buttons still flow and wrap as text. */
const clipToLines = (lines: number) => ({
  display: "block",
  lineHeight: CAPTION_LINE_HEIGHT,
  maxHeight: `${lines * CAPTION_LINE_HEIGHT}em`,
  overflow: "hidden",
  overflowWrap: "anywhere",
});

const CARD_NAME = { fontWeight: 600, width: "100%", ...clampToLines(2) };

const CARD_TAGS = {
  color: "text.secondary",
  width: "100%",
  ...clipToLines(2),
};

export const TestRunGrid = ({
  groups,
  selectedIdSet,
  density,
  showDiff,
  activeTags,
  tagFieldsFor,
  noiseAvailable,
  onToggleGroup,
  onToggleTag,
  onOpen,
}: {
  groups: TestRunGroup[];
  selectedIdSet: Set<string>;
  density: TestRunDensity;
  showDiff: boolean;
  activeTags: string[];
  tagFieldsFor: (runCount: number) => TagField[];
  noiseAvailable: boolean;
  onToggleGroup: (ids: string[]) => void;
  onToggleTag: (tag: string) => void;
  onOpen: (id: string) => void;
}) => (
  <Box
    data-testid="testRunGrid"
    sx={{
      display: "grid",
      gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_SIZE_BY_DENSITY[density].width}px, 1fr))`,
      gap: 1,
      padding: 2,
    }}
  >
    {groups.map(({ key, runs, representative }) => {
      const ids = runs.map((run) => run.id);
      const selectedCount = ids.filter((id) => selectedIdSet.has(id)).length;
      const tags = tagValuesOf(representative, tagFieldsFor(runs.length));

      return (
        <Card key={key} variant="outlined" data-testid="testRunCard">
          {/* outside the action area, so a tick does not open the dialog */}
          <Box sx={{ position: "relative" }}>
            <CardActionArea onClick={() => onOpen(representative.id)}>
              <Box
                component="img"
                src={thumbnailFor(representative, showDiff)}
                alt={representative.name}
                loading="lazy"
                decoding="async"
                onError={(event: SyntheticEvent<HTMLImageElement>) => {
                  event.currentTarget.src = noImage;
                }}
                sx={{
                  display: "block",
                  width: "100%",
                  height: CARD_SIZE_BY_DENSITY[density].imageHeight,
                  objectFit: "contain",
                  objectPosition: "top",
                  backgroundColor: "grey.100",
                }}
              />
            </CardActionArea>
            <Checkbox
              size="small"
              checked={selectedCount === ids.length}
              indeterminate={selectedCount > 0 && selectedCount < ids.length}
              onChange={() => onToggleGroup(ids)}
              sx={{
                position: "absolute",
                top: 2,
                left: 2,
                padding: 0.5,
                backgroundColor: "rgba(255, 255, 255, 0.85)",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.95)" },
              }}
              slotProps={{
                input: { "aria-label": `Select ${representative.name}` },
              }}
            />
            {runs.length > 1 && (
              <Chip
                size="small"
                label={runs.length}
                data-testid="groupCount"
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  color: "common.white",
                }}
              />
            )}
          </Box>
          <CardContent
            // body centres text globally, hence the explicit left
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 0.75,
              paddingX: 1,
              paddingY: 1,
              textAlign: "left",
              "&:last-child": { paddingBottom: 1 },
            }}
          >
            <Typography
              variant="body2"
              title={representative.name}
              data-testid="cardName"
              sx={CARD_NAME}
            >
              {representative.name}
            </Typography>
            {/* the chip shows the representative only; the title gives the group's status */}
            <Box component="span" title={groupStatusSummary(runs) || undefined}>
              <TestStatusChip status={representative.status} />
            </Box>
            {noiseAvailable && <NoiseHintChip run={representative} />}
            {/* buttons so the keyboard reaches them */}
            <Typography
              variant="caption"
              title={tags.join(" · ")}
              data-testid="cardTags"
              sx={CARD_TAGS}
            >
              {tags.map((tag, index) => {
                const filteringBy = activeTags.includes(tag);

                return (
                  <Fragment key={`${index}-${tag}`}>
                    {index > 0 && " · "}
                    <Box
                      component="button"
                      type="button"
                      onClick={() => onToggleTag(tag)}
                      data-testid="cardTag"
                      sx={{
                        ...TAG_BUTTON,
                        color: filteringBy ? "primary.main" : "inherit",
                        fontWeight: filteringBy ? 600 : undefined,
                      }}
                    >
                      {tag}
                    </Box>
                  </Fragment>
                );
              })}
            </Typography>
          </CardContent>
        </Card>
      );
    })}
  </Box>
);
