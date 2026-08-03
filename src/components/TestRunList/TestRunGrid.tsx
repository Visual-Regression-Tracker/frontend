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
import { staticService } from "../../services";
import noImage from "../../static/no-image.png";
import { CARD_SIZE_BY_DENSITY, TestRunDensity } from "./TestRunListControls";
import { TestRunGroup } from "../../_helpers/testRunGroup.helper";

export const TestRunGrid: React.FunctionComponent<{
  groups: TestRunGroup[];
  selectedIds: string[];
  density: TestRunDensity;
  onToggleGroup: (ids: string[]) => void;
  onOpen: (id: string) => void;
}> = ({ groups, selectedIds, density, onToggleGroup, onOpen }) => (
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
          <CardActionArea onClick={() => onOpen(representative.id)}>
            <Box position="relative">
              <Box
                component="img"
                src={staticService.getImage(
                  representative.diffName || representative.imageName,
                )}
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
          </CardActionArea>
          <CardContent
            // body carries a global text-align: center, hence the explicit left
            sx={{
              padding: 0.5,
              textAlign: "left",
              "&:last-child": { paddingBottom: 0.5 },
            }}
          >
            <Box display="flex" alignItems="flex-start">
              <Checkbox
                size="small"
                checked={selectedCount === ids.length}
                indeterminate={selectedCount > 0 && selectedCount < ids.length}
                onChange={() => onToggleGroup(ids)}
                inputProps={{ "aria-label": `Select ${representative.name}` }}
              />
              <Box minWidth={0} flex={1}>
                <Typography variant="body2" noWrap title={representative.name}>
                  {representative.name}
                </Typography>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  marginTop={0.5}
                >
                  <TestStatusChip status={representative.status} />
                  {!!representative.diffPercent && (
                    <Typography variant="caption" color="textSecondary">
                      {representative.diffPercent.toFixed(2)}%
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      );
    })}
  </Box>
);
