import React from "react";
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
import noImage from "../../static/no-image.png";
import { CARD_SIZE_BY_DENSITY, TestRunDensity } from "./TestRunListControls";
import {
  groupStatusSummary,
  TestRunGroup,
} from "../../_helpers/testRunGroup.helper";
import { imageFor } from "../../_helpers/testRunImage.helper";
import { tagValuesOf } from "../../_helpers/testRunTags.helper";
import { TestRun } from "../../types";

/**
 * Wraps onto the next line and stops after a few, rather than cutting the text
 * off at the first: a narrow card holds neither a long screen name nor a row of
 * tags on one line, and an ellipsis after two words says nothing.
 */
const clampToLines = (lines: number) => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: lines,
  overflow: "hidden",
  overflowWrap: "anywhere",
});

const CAPTION_LINE_HEIGHT = 1.66;

/**
 * The same two-line box for a row that holds elements rather than plain text:
 * `-webkit-box` blockifies its children, which would stop the tags from
 * flowing and wrapping as text.
 */
const clipToLines = (lines: number) => ({
  display: "block",
  lineHeight: CAPTION_LINE_HEIGHT,
  maxHeight: `${lines * CAPTION_LINE_HEIGHT}em`,
  overflow: "hidden",
  overflowWrap: "anywhere",
});

export const TestRunGrid: React.FunctionComponent<{
  groups: TestRunGroup[];
  selectedIds: string[];
  density: TestRunDensity;
  showDiff: boolean;
  activeTags: string[];
  tagFieldsFor: (runCount: number) => Array<keyof TestRun>;
  onToggleGroup: (ids: string[]) => void;
  onToggleTag: (tag: string) => void;
  onOpen: (id: string) => void;
}> = ({
  groups,
  selectedIds,
  density,
  showDiff,
  activeTags,
  tagFieldsFor,
  onToggleGroup,
  onToggleTag,
  onOpen,
}) => (
  <Box
    display="grid"
    gridTemplateColumns={`repeat(auto-fill, minmax(${CARD_SIZE_BY_DENSITY[density].width}px, 1fr))`}
    gap={1}
    padding={2}
    data-testid="testRunGrid"
  >
    {groups.map(({ key, runs, representative }) => {
      const ids = runs.map((run) => run.id);
      const selectedCount = ids.filter((id) => selectedIds.includes(id)).length;
      const tags = tagValuesOf(representative, tagFieldsFor(runs.length));

      return (
        <Card key={key} variant="outlined" data-testid="testRunCard">
          {/* the checkbox sits over the image, outside the action area, so the
              picture keeps the full width of the card and a tick does not open
              the dialog */}
          <Box position="relative">
            <CardActionArea onClick={() => onOpen(representative.id)}>
              <Box
                component="img"
                src={imageFor(representative, showDiff)}
                alt={representative.name}
                loading="lazy"
                decoding="async"
                onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
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
              inputProps={{ "aria-label": `Select ${representative.name}` }}
              sx={{
                position: "absolute",
                top: 2,
                left: 2,
                padding: 0.5,
                // legible over a screenshot of any colour
                backgroundColor: "rgba(255, 255, 255, 0.85)",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.95)" },
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
            // body carries a global text-align: center, hence the explicit left.
            // Rules between the three lines read as a table; weight, colour and
            // size already tell them apart, so they only need even spacing.
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
              fontWeight={600}
              width="100%"
              sx={clampToLines(2)}
              title={representative.name}
              data-testid="cardName"
            >
              {representative.name}
            </Typography>
            {/* the chip speaks for the representative, so a half-reviewed
                group has to say so somewhere */}
            <Box component="span" title={groupStatusSummary(runs) || undefined}>
              <TestStatusChip status={representative.status} />
            </Box>
            {/* tags as quiet text, not chips: five chips wrap over three lines
                on a narrow card and drown out the name and the status. Each is
                a button that filters the list by it, and buttons rather than
                spans so the keyboard reaches them; inline, so the row still
                wraps and clamps as plain text. */}
            <Typography
              variant="caption"
              color="text.secondary"
              width="100%"
              sx={clipToLines(2)}
              title={tags.join(" · ")}
              data-testid="cardTags"
            >
              {tags.map((tag, index) => (
                <React.Fragment key={`${index}-${tag}`}>
                  {index > 0 && " · "}
                  <Box
                    component="button"
                    type="button"
                    onClick={() => onToggleTag(tag)}
                    data-testid="cardTag"
                    sx={{
                      display: "inline",
                      font: "inherit",
                      // a button's own letter-spacing is normal, which would
                      // set the tags a shade tighter than the caption text
                      letterSpacing: "inherit",
                      background: "none",
                      border: 0,
                      padding: 0,
                      cursor: "pointer",
                      color: activeTags.includes(tag)
                        ? "primary.main"
                        : "inherit",
                      fontWeight: activeTags.includes(tag) ? 600 : undefined,
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    {tag}
                  </Box>
                </React.Fragment>
              ))}
            </Typography>
          </CardContent>
        </Card>
      );
    })}
  </Box>
);
