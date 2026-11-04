import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Box,
  LinearProgress,
  TablePagination,
  Typography,
} from "@mui/material";
import type {
  GridPaginationModel,
  ToolbarPropsOverrides,
} from "@mui/x-data-grid";
import { useHotkeys } from "react-hotkeys-hook";
import { hotkeyMatching } from "../../_helpers/hotkeys.helper";
import { pluralize } from "../../_helpers/format.helper";
import { TestRunGroup } from "../../_helpers/testRunGroup.helper";
import { TEST_RUN_SHOW_DIFF_KEY } from "../../constants";
import { TagField } from "../../types";
import type { TestRunSort } from "../../types/testRunSort";
import { TestRunGrid } from "./TestRunGrid";
import { TestRunGridHeader } from "./TestRunGridHeader";
import { TestRunListToolbar } from "./TestRunListToolbar";
import { PAGE_SIZE_OPTIONS } from "./TestRunListControls";

export const TestRunCardView = ({
  toolbarProps,
  groups,
  selectedIds,
  loading,
  sort,
  onSortChange,
  paginationModel,
  onPaginationModelChange,
  activeTags,
  tagFieldsFor,
  hotkeysEnabled,
  onToggleAll,
  onToggleGroup,
  onToggleTag,
  onOpen,
}: {
  toolbarProps: ToolbarPropsOverrides;
  groups: TestRunGroup[];
  selectedIds: string[];
  loading: boolean;
  sort: TestRunSort;
  onSortChange: (sort: TestRunSort) => void;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: Dispatch<SetStateAction<GridPaginationModel>>;
  activeTags: string[];
  tagFieldsFor: (runCount: number) => TagField[];
  hotkeysEnabled: boolean;
  onToggleAll: (ids: string[]) => void;
  onToggleGroup: (ids: string[]) => void;
  onToggleTag: (tag: string) => void;
  onOpen: (id: string) => void;
}) => {
  const { density } = toolbarProps;
  const [showDiff, setShowDiff] = useState(
    () => localStorage.getItem(TEST_RUN_SHOW_DIFF_KEY) !== "false",
  );
  useEffect(() => {
    localStorage.setItem(TEST_RUN_SHOW_DIFF_KEY, String(showDiff));
  }, [showDiff]);

  useHotkeys("d", () => setShowDiff((prev) => !prev), {
    ...hotkeyMatching,
    enabled: hotkeysEnabled,
  });

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
      <TestRunListToolbar
        {...toolbarProps}
        diffToggle={{ checked: showDiff, onChange: setShowDiff }}
      />
      <TestRunGridHeader
        sort={sort}
        onSortChange={onSortChange}
        density={density}
        selectedCount={
          navigationIds.filter((id) => selectedIdSet.has(id)).length
        }
        totalCount={navigationIds.length}
        onToggleAll={() => onToggleAll(navigationIds)}
      />
      {loading && <LinearProgress />}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {groups.length === 0 ? (
          <Typography
            variant="subtitle1"
            align="center"
            color="textSecondary"
            sx={{ padding: 2 }}
            data-testid="testRunGridEmpty"
          >
            No test runs match the filters
          </Typography>
        ) : (
          <TestRunGrid
            groups={pagedGroups}
            selectedIdSet={selectedIdSet}
            density={density}
            showDiff={showDiff}
            activeTags={activeTags}
            tagFieldsFor={tagFieldsFor}
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
            data-testid="gridSelectionCount"
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
