import { type Dispatch, type SetStateAction, useMemo } from "react";
import {
  Box,
  LinearProgress,
  TablePagination,
  Typography,
} from "@mui/material";
import type { GridPaginationModel } from "@mui/x-data-grid";
import { pluralize } from "../../_helpers/format.helper";
import { TestRunGroup } from "../../_helpers/testRunGroup.helper";
import { TagField } from "../../types";
import type { TestRunSort } from "../../types/testRunSort";
import { NoMatchState } from "../GridEmptyState";
import { TestRunGrid } from "./TestRunGrid";
import { TestRunGridToolbar } from "./TestRunGridToolbar";
import { PAGE_SIZE_OPTIONS, TestRunDensity } from "./TestRunListControls";
import type { TagFilters } from "./useTestRunFilters";
import { TEST_ID } from "../../constants/locators";

export const TestRunCardView = ({
  density,
  showDiff,
  groups,
  selectedIds,
  loading,
  sort,
  onSortChange,
  paginationModel,
  onPaginationModelChange,
  activeTags,
  tagFieldsFor,
  noiseAvailable,
  onToggleAll,
  onToggleGroup,
  onToggleTag,
  onOpen,
}: {
  density: TestRunDensity;
  showDiff: boolean;
  groups: TestRunGroup[];
  selectedIds: string[];
  loading: boolean;
  sort: TestRunSort;
  onSortChange: (sort: TestRunSort) => void;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: Dispatch<SetStateAction<GridPaginationModel>>;
  activeTags: TagFilters;
  tagFieldsFor: (runCount: number) => TagField[];
  noiseAvailable: boolean;
  onToggleAll: (ids: string[]) => void;
  onToggleGroup: (ids: string[]) => void;
  onToggleTag: (field: TagField, tag: string) => void;
  onOpen: (id: string) => void;
}) => {
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const navigationIds = useMemo(
    () => groups.flatMap((group) => group.runs.map((run) => run.id)),
    [groups],
  );

  const selectedCardCount = useMemo(
    () =>
      groups.filter((group) =>
        group.runs.some((run) => selectedIdSet.has(run.id)),
      ).length,
    [groups, selectedIdSet],
  );

  // clamped, not corrected in state: grouping changes the page count under it
  const pageCount = Math.max(
    1,
    Math.ceil(groups.length / paginationModel.pageSize),
  );
  const page = Math.min(paginationModel.page, pageCount - 1);
  const pagedGroups = groups.slice(
    page * paginationModel.pageSize,
    (page + 1) * paginationModel.pageSize,
  );

  return (
    // framed like the data grid; text.primary stops the body's black reading heavier
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        color: "text.primary",
      }}
    >
      <TestRunGridToolbar
        sort={sort}
        onSortChange={onSortChange}
        noiseAvailable={noiseAvailable}
        selectedCount={
          navigationIds.filter((id) => selectedIdSet.has(id)).length
        }
        totalCount={navigationIds.length}
        onToggleAll={() => onToggleAll(navigationIds)}
      />
      {loading && <LinearProgress />}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {groups.length === 0 ? (
          <NoMatchState
            title="No test runs match the filters"
            testId="testRunGridEmpty"
          />
        ) : (
          <TestRunGrid
            groups={pagedGroups}
            selectedIdSet={selectedIdSet}
            density={density}
            showDiff={showDiff}
            activeTags={activeTags}
            tagFieldsFor={tagFieldsFor}
            noiseAvailable={noiseAvailable}
            onToggleGroup={onToggleGroup}
            onToggleTag={onToggleTag}
            onOpen={onOpen}
          />
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        {selectedCardCount > 0 && (
          <Typography
            variant="body2"
            data-testid={TEST_ID.gridSelectionCount}
            sx={{ marginLeft: 2 }}
          >
            {`${selectedCardCount} ${pluralize(selectedCardCount, "card")} selected`}
          </Typography>
        )}
        <Box sx={{ marginLeft: "auto" }}>
          <TablePagination
            component="div"
            count={groups.length}
            page={page}
            rowsPerPage={paginationModel.pageSize}
            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
            labelRowsPerPage="Cards per page:"
            onPageChange={(_event, next) =>
              onPaginationModelChange((prev) => ({ ...prev, page: next }))
            }
            onRowsPerPageChange={(event) =>
              onPaginationModelChange({
                page: 0,
                pageSize: Number(event.target.value),
              })
            }
          />
        </Box>
      </Box>
    </Box>
  );
};
