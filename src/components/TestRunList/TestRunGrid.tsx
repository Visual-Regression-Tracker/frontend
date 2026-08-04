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
import { TestRunGroup } from "../../_helpers/testRunGroup.helper";
import { imageFor } from "../../_helpers/testRunImage.helper";
import { tagsOf } from "../../_helpers/testRunTags.helper";
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

export const TestRunGrid: React.FunctionComponent<{
  groups: TestRunGroup[];
  selectedIds: string[];
  density: TestRunDensity;
  showDiff: boolean;
  tagFieldsFor: (runCount: number) => Array<keyof TestRun>;
  onToggleGroup: (ids: string[]) => void;
  onOpen: (id: string) => void;
}> = ({
  groups,
  selectedIds,
  density,
  showDiff,
  tagFieldsFor,
  onToggleGroup,
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
            <TestStatusChip status={representative.status} />
            {/* tags as quiet text, not chips: five chips wrap over three lines
                on a narrow card and drown out the name and the status */}
            <Typography
              variant="caption"
              color="text.secondary"
              width="100%"
              sx={clampToLines(2)}
              title={tagsOf(representative, tagFieldsFor(runs.length))}
              data-testid="cardTags"
            >
              {tagsOf(representative, tagFieldsFor(runs.length))}
            </Typography>
          </CardContent>
        </Card>
      );
    })}
  </Box>
);
