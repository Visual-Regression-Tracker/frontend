import React from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Typography,
} from "@mui/material";
import { TestRun } from "../../types";
import TestStatusChip from "../TestStatusChip";
import { staticService } from "../../services";
import noImage from "../../static/no-image.png";

const CARD_WIDTH = 220;
const IMAGE_HEIGHT = 160;

export const TestRunGrid: React.FunctionComponent<{
  rows: TestRun[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
}> = ({ rows, selectedIds, onToggleSelect, onOpen }) => (
  <Box
    display="grid"
    gridTemplateColumns={`repeat(auto-fill, minmax(${CARD_WIDTH}px, 1fr))`}
    gap={1}
    padding={2}
    data-testid="testRunGrid"
  >
    {rows.map((run) => (
      <Card key={run.id} variant="outlined" data-testid="testRunCard">
        <CardActionArea onClick={() => onOpen(run.id)}>
          <Box
            component="img"
            src={staticService.getImage(run.diffName || run.imageName)}
            alt={run.name}
            loading="lazy"
            decoding="async"
            onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
              event.currentTarget.src = noImage;
            }}
            sx={{
              display: "block",
              width: "100%",
              height: IMAGE_HEIGHT,
              objectFit: "contain",
              objectPosition: "top",
              backgroundColor: "grey.100",
            }}
          />
        </CardActionArea>
        <CardContent
          sx={{ padding: 0.5, "&:last-child": { paddingBottom: 0.5 } }}
        >
          <Box display="flex" alignItems="flex-start">
            <Checkbox
              size="small"
              checked={selectedIds.includes(run.id)}
              onChange={() => onToggleSelect(run.id)}
              inputProps={{ "aria-label": `Select ${run.name}` }}
            />
            <Box minWidth={0} flex={1}>
              <Typography variant="body2" noWrap title={run.name}>
                {run.name}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5} marginTop={0.5}>
                <TestStatusChip status={run.status} />
                {!!run.diffPercent && (
                  <Typography variant="caption" color="textSecondary">
                    {run.diffPercent.toFixed(2)}%
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    ))}
  </Box>
);
