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
import { StatusChip } from "../StatusChip";
import { NoiseHintChip } from "./NoiseHintChip";
import { TagLine } from "../TagLine";
import { CommentIndicator } from "../CommentIndicator";
import { PAGE_SIZE_OPTIONS } from "./TestRunListControls";
import { TAG_FIELDS } from "../../_helpers/testRunTags.helper";
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

const NOISE_COLUMN: GridColDef<TestRun> = {
  field: "noise",
  headerName: "Noise",
  display: "flex",
  flex: 0.3,
  minWidth: NOISE_COLUMN_MIN_WIDTH,
  filterable: false,
  sortable: false,
  renderCell: (params: GridRenderCellParams<TestRun>) => (
    <NoiseHintChip run={params.row} />
  ),
};

const buildColumns = (noiseAvailable: boolean): GridColDef<TestRun>[] => [
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
    renderCell: (params: GridRenderCellParams<TestRun>) => (
      <Box sx={NAME_CELL_SX}>
        <Typography variant="body2" noWrap title={params.row.name}>
          {params.row.name}
        </Typography>
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
    renderCell: (params: GridRenderCellParams<TestRun>) => (
      <TagLine
        tags={Object.fromEntries(
          TAG_FIELDS.map((field) => [field, params.row[field]]),
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
    renderCell: (params: GridRenderCellParams<TestRun>) => (
      <StatusChip status={params.row.status?.toString()} />
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
  rows,
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
  rows: TestRun[];
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
  const columns = useMemo(() => buildColumns(noiseAvailable), [noiseAvailable]);

  // a stable object, so the grid does not re-sync on every render
  const rowSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({ type: "include", ids: new Set(selectedIds) }),
    [selectedIds],
  );

  const onRowSelectionModelChange = useCallback(
    (model: GridRowSelectionModel) =>
      // the header box selects everything as an exclude list
      onSelectionChange(
        model.type === "include"
          ? [...model.ids].map(String)
          : rows.map((row) => row.id).filter((id) => !model.ids.has(id)),
      ),
    [rows, onSelectionChange],
  );

  const onRowClick = useCallback(
    (param: GridRowParams<TestRun>) => onOpen(String(param.row.id)),
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
