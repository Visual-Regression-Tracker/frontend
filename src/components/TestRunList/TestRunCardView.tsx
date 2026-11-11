import { type Dispatch, type SetStateAction, useMemo } from "react";
import {
  Box,
  LinearProgress,
  TablePagination,
  Typography,
} from "@mui/material";
import type { GridPaginationModel } from "@mui/x-data-grid";
import { pluralize } from "../../_helpers/format.helper";
import { TagField, TestRun } from "../../types";
import type { TestRunSort } from "../../types/testRunSort";
import { NoMatchState } from "../GridEmptyState";
import { TestRunGrid } from "./TestRunGrid";
import { TestRunGridToolbar } from "./TestRunGridToolbar";
import { PAGE_SIZE_OPTIONS } from "./TestRunListControls";
import type { TagFilters } from "./useTestRunFilters";
import { TEST_ID } from "../../constants/locators";

export const TestRunCardView = ({
  runs,
  selectedIds,
  loading,
  sort,
  onSortChange,
  paginationModel,
  onPaginationModelChange,
  activeTags,
  noiseAvailable,
  onToggleAll,
  onToggleOne,
  onToggleTag,
  onOpen,
}: {
  runs: TestRun[];
  selectedIds: string[];
  loading: boolean;
  sort: TestRunSort;
  onSortChange: (sort: TestRunSort) => void;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: Dispatch<SetStateAction<GridPaginationModel>>;
  activeTags: TagFilters;
  noiseAvailable: boolean;
  onToggleAll: (ids: string[]) => void;
  onToggleOne: (id: string) => void;
  onToggleTag: (field: TagField, tag: string) => void;
  onOpen: (id: string) => void;
}) => {
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const runIds = useMemo(() => runs.map((run) => run.id), [runs]);
  const selectedCount = runIds.filter((id) => selectedIdSet.has(id)).length;

  // clamped, not corrected in state: filtering changes the page count under it
  const pageCount = Math.max(
    1,
    Math.ceil(runs.length / paginationModel.pageSize),
  );
  const page = Math.min(paginationModel.page, pageCount - 1);
  const pagedRuns = runs.slice(
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
        selectedCount={selectedCount}
        totalCount={runIds.length}
        onToggleAll={() => onToggleAll(runIds)}
      />
      {loading && <LinearProgress />}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {runs.length === 0 ? (
          <NoMatchState
            title="No test runs match the filters"
            testId="testRunGridEmpty"
          />
        ) : (
          <TestRunGrid
            runs={pagedRuns}
            selectedIdSet={selectedIdSet}
            activeTags={activeTags}
            noiseAvailable={noiseAvailable}
            onToggleOne={onToggleOne}
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
        {selectedCount > 0 && (
          <Typography
            variant="body2"
            data-testid={TEST_ID.gridSelectionCount}
            sx={{ marginLeft: 2 }}
          >
            {`${selectedCount} ${pluralize(selectedCount, "card")} selected`}
          </Typography>
        )}
        <Box sx={{ marginLeft: "auto" }}>
          <TablePagination
            component="div"
            count={runs.length}
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
