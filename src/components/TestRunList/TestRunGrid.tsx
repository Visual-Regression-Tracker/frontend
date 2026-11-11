import { Fragment, type SyntheticEvent } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Stack,
  Typography,
} from "@mui/material";
import { CommentIndicator } from "../CommentIndicator";
import { StatusChip } from "../StatusChip";
import { NoiseHintChip } from "./NoiseHintChip";
import noImage from "../../static/no-image.png";
import { thumbnailFor } from "../../_helpers/testRunImage.helper";
import { TAG_FIELDS } from "../../_helpers/testRunTags.helper";
import type { TagFilters } from "./useTestRunFilters";
import { TagField, TestRun } from "../../types";
import { TEST_ID } from "../../constants/locators";
import { imageOverlay } from "../../theme/tokens";

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

const CARD_WIDTH = 220;
const CARD_IMAGE_HEIGHT = 160;

export const TestRunGrid = ({
  runs,
  selectedIdSet,
  activeTags,
  noiseAvailable,
  onToggleOne,
  onToggleTag,
  onOpen,
}: {
  runs: TestRun[];
  selectedIdSet: Set<string>;
  activeTags: TagFilters;
  noiseAvailable: boolean;
  onToggleOne: (id: string) => void;
  onToggleTag: (field: TagField, tag: string) => void;
  onOpen: (id: string) => void;
}) => (
  <Box
    data-testid={TEST_ID.testRunGrid}
    sx={{
      display: "grid",
      gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH}px, 1fr))`,
      gap: 1,
      padding: 2,
    }}
  >
    {runs.map((run) => {
      const tags = TAG_FIELDS.flatMap((field) => {
        const value = run[field];
        return typeof value === "string" && value ? [{ field, value }] : [];
      });

      return (
        <Card key={run.id} variant="outlined" data-testid={TEST_ID.testRunCard}>
          {/* outside the action area, so a tick does not open the dialog */}
          <Box sx={{ position: "relative" }}>
            <CardActionArea onClick={() => onOpen(run.id)}>
              <Box
                component="img"
                src={thumbnailFor(run, true)}
                alt={run.name}
                loading="lazy"
                decoding="async"
                onError={(event: SyntheticEvent<HTMLImageElement>) => {
                  event.currentTarget.src = noImage;
                }}
                sx={{
                  display: "block",
                  width: "100%",
                  height: CARD_IMAGE_HEIGHT,
                  objectFit: "contain",
                  objectPosition: "top",
                  backgroundColor: "grey.100",
                }}
              />
            </CardActionArea>
            <Checkbox
              size="small"
              checked={selectedIdSet.has(run.id)}
              onChange={() => onToggleOne(run.id)}
              sx={{
                position: "absolute",
                top: 2,
                left: 2,
                padding: 0.5,
                backgroundColor: imageOverlay.control,
                "&:hover": { backgroundColor: imageOverlay.controlHover },
              }}
              slotProps={{
                input: { "aria-label": `Select ${run.name}` },
              }}
            />
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
              title={run.name}
              data-testid={TEST_ID.cardName}
              sx={CARD_NAME}
            >
              {run.name}
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
              <StatusChip status={run.status} />
              <CommentIndicator text={run.comment} />
            </Stack>
            {noiseAvailable && <NoiseHintChip run={run} />}
            {/* buttons so the keyboard reaches them */}
            <Typography
              variant="caption"
              title={tags.map(({ value }) => value).join(" · ")}
              data-testid={TEST_ID.cardTags}
              sx={CARD_TAGS}
            >
              {tags.map(({ field, value: tag }, index) => {
                const filteringBy = activeTags[field].includes(tag);

                return (
                  <Fragment key={`${field}-${tag}`}>
                    {index > 0 && " · "}
                    <Box
                      component="button"
                      type="button"
                      onClick={() => onToggleTag(field, tag)}
                      data-testid={TEST_ID.cardTag}
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
