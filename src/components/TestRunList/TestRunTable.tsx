import { useCallback, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
  GridRowParams,
  GridRowSelectionModel,
  GridSortDirection,
  GridSortModel,
} from "@mui/x-data-grid";
import { gridEmptyState } from "../GridEmptyState";
import { NoiseHintChip } from "./NoiseHintChip";
import { TagLine } from "../TagLine";
import { CommentIndicator } from "../CommentIndicator";
import { PAGE_SIZE_OPTIONS } from "./TestRunListControls";
import { GroupCountChip, GroupStatusChip } from "./GroupChips";
import type { TestRunGroup } from "../../_helpers/testRunGroup.helper";
import { TestRun } from "../../types";

const HIDDEN_COLUMNS = { id: false };

const GRID_SLOTS = {
  noRowsOverlay: gridEmptyState("No test runs match the filters"),
};

const NAME_CELL_SX = {
  display: "flex",
  alignItems: "center",
  gap: 0.5,
  minWidth: 0,
} as const;

const STATUS_COLUMN_MIN_WIDTH = 130;
const DIFF_COLUMN_WIDTH = 90;

// fits the "Likely change" chip and its padding
const NOISE_COLUMN_MIN_WIDTH = 136;

// the rows always follow some sort, so the header cannot offer "unsorted"
const SORTING_ORDER: GridSortDirection[] = ["asc", "desc"];

type GroupRow = TestRun & { group: TestRunGroup };

const NOISE_COLUMN: GridColDef<GroupRow> = {
  field: "noise",
  headerName: "Noise",
  display: "flex",
  flex: 0.3,
  minWidth: NOISE_COLUMN_MIN_WIDTH,
  filterable: false,
  sortable: false,
  renderCell: (params: GridRenderCellParams<GroupRow>) => (
    <NoiseHintChip run={params.row} />
  ),
};

const buildColumns = (noiseAvailable: boolean): GridColDef<GroupRow>[] => [
  {
    field: "id",
    filterable: false,
  },
  {
    field: "name",
    headerName: "Name",
    // the data grid does not centre a custom cell on its own
    display: "flex",
    flex: 1,
    filterable: false,
    renderCell: (params: GridRenderCellParams<GroupRow>) => (
      <Box sx={NAME_CELL_SX}>
        <Typography variant="body2" noWrap title={params.row.name}>
          {params.row.name}
        </Typography>
        <GroupCountChip group={params.row.group} />
        <CommentIndicator
          text={params.row.comment}
          tabIndex={params.tabIndex}
        />
      </Box>
    ),
  },
  {
    field: "tags",
    headerName: "Tags",
    display: "flex",
    flex: 1,
    filterable: false,
    renderCell: (params: GridRenderCellParams<GroupRow>) => (
      <TagLine
        tags={Object.fromEntries(
          params.row.group.tagFields.map((field) => [field, params.row[field]]),
        )}
      />
    ),
  },
  {
    field: "status",
    headerName: "Status",
    display: "flex",
    flex: 0.3,
    minWidth: STATUS_COLUMN_MIN_WIDTH,
    filterable: false,
    renderCell: (params: GridRenderCellParams<GroupRow>) => (
      <GroupStatusChip group={params.row.group} />
    ),
  },
  ...(noiseAvailable ? [NOISE_COLUMN] : []),
  {
    field: "diff",
    headerName: "Diff %",
    display: "flex",
    width: DIFF_COLUMN_WIDTH,
    filterable: false,
    sortable: false,
    valueGetter: (_value, row) =>
      row.diffPercent == null ? "—" : `${row.diffPercent.toFixed(2)}%`,
  },
];

export const TestRunTable = ({
  groups,
  noiseAvailable,
  selectedIds,
  onSelectionChange,
  loading,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  onOpen,
}: {
  groups: TestRunGroup[];
  noiseAvailable: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  loading: boolean;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  sortModel: GridSortModel;
  onSortModelChange: (model: GridSortModel) => void;
  onOpen: (id: string) => void;
}) => {
  const rows = useMemo<GroupRow[]>(
    () => groups.map((group) => ({ ...group.representative, group })),
    [groups],
  );
  const columns = useMemo(() => buildColumns(noiseAvailable), [noiseAvailable]);

  const tableSelectionModel = useMemo(() => {
    const selectedIdSet = new Set(selectedIds);
    return groups
      .filter((group) => group.runs.every((run) => selectedIdSet.has(run.id)))
      .map((group) => group.representative.id);
  }, [groups, selectedIds]);

  // a stable object, so the grid does not re-sync on every render
  const rowSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({ type: "include", ids: new Set(tableSelectionModel) }),
    [tableSelectionModel],
  );

  const onRowSelectionModelChange = useCallback(
    (model: GridRowSelectionModel) => {
      // the header box selects everything as an exclude list
      const ticked =
        model.type === "include"
          ? [...model.ids].map(String)
          : rows.map((row) => row.id).filter((id) => !model.ids.has(id));
      const byId = new Map(rows.map((row) => [row.id, row.group]));
      onSelectionChange(
        ticked.flatMap((id) => byId.get(id)?.runs.map((run) => run.id) ?? []),
      );
    },
    [rows, onSelectionChange],
  );

  const onRowClick = useCallback(
    (param: GridRowParams<GroupRow>) => onOpen(String(param.row.id)),
    [onOpen],
  );

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      columnVisibilityModel={HIDDEN_COLUMNS}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      paginationModel={paginationModel}
      onPaginationModelChange={onPaginationModelChange}
      pagination
      hideFooterSelectedRowCount
      loading={loading}
      rowSelectionModel={rowSelectionModel}
      onRowSelectionModelChange={onRowSelectionModelChange}
      checkboxSelection
      disableColumnSelector
      disableColumnMenu
      disableRowSelectionOnClick
      sortingMode="server"
      sortingOrder={SORTING_ORDER}
      sortModel={sortModel}
      onSortModelChange={onSortModelChange}
      onRowClick={onRowClick}
      slots={GRID_SLOTS}
    />
  );
};
