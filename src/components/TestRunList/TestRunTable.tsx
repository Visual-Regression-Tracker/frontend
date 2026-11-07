import { useCallback, useEffect, useMemo } from "react";
import { Box, Chip, Typography } from "@mui/material";
import {
  DataGrid,
  useGridApiRef,
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
  GridRowParams,
  GridRowSelectionModel,
  GridSortDirection,
  GridSortModel,
} from "@mui/x-data-grid";
import { StatusChip } from "../StatusChip";
import { NoiseHintChip } from "./NoiseHintChip";
import { TagLine } from "../TagLine";
import { PAGE_SIZE_OPTIONS, TestRunDensity } from "./TestRunListControls";
import {
  groupStatusSummary,
  TestRunGroup,
} from "../../_helpers/testRunGroup.helper";
import { TagField, TestRun } from "../../types";

const HIDDEN_COLUMNS = { id: false };

const NAME_CELL_SX = {
  display: "flex",
  alignItems: "center",
  gap: 0.5,
  minWidth: 0,
} as const;

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
  sortingOrder: ["desc", "asc"],
  renderCell: (params: GridRenderCellParams<TestRun>) => (
    <NoiseHintChip run={params.row} />
  ),
};

const buildColumns = (
  runsFor: (id: string) => TestRun[],
  tagFieldsFor: (runCount: number) => TagField[],
  noiseAvailable: boolean,
): GridColDef<TestRun>[] => [
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
    renderCell: (params: GridRenderCellParams<TestRun>) => {
      const count = runsFor(params.row.id).length;

      return (
        <Box sx={NAME_CELL_SX}>
          <Typography variant="body2" noWrap title={params.row.name}>
            {params.row.name}
          </Typography>
          {count > 1 && (
            <Chip size="small" label={count} data-testid="groupCount" />
          )}
        </Box>
      );
    },
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
          tagFieldsFor(runsFor(params.row.id).length).map((field) => [
            field,
            params.row[field],
          ]),
        )}
      />
    ),
  },
  {
    field: "status",
    headerName: "Status",
    display: "flex",
    flex: 0.3,
    filterable: false,
    // the chip shows the representative only, so the title gives the whole group
    renderCell: (params: GridRenderCellParams<TestRun>) => (
      <Box
        component="span"
        title={groupStatusSummary(runsFor(params.row.id)) || undefined}
      >
        <StatusChip status={params.row.status?.toString()} />
      </Box>
    ),
  },
  ...(noiseAvailable ? [NOISE_COLUMN] : []),
  {
    field: "diff",
    headerName: "Diff %",
    display: "flex",
    flex: 0.2,
    filterable: false,
    sortable: false,
    valueGetter: (_value, row) => `${row.diffPercent.toFixed(2)}%`,
  },
];

export const TestRunTable = ({
  groups,
  grouped,
  tagFieldsFor,
  noiseAvailable,
  selectedIds,
  onSelectionChange,
  loading,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  density,
  onOpen,
}: {
  groups: TestRunGroup[];
  grouped: boolean;
  tagFieldsFor: (runCount: number) => TagField[];
  noiseAvailable: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  loading: boolean;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  sortModel: GridSortModel;
  onSortModelChange: (model: GridSortModel) => void;
  density: TestRunDensity;
  onOpen: (id: string) => void;
}) => {
  const apiRef = useGridApiRef();

  const rows = useMemo(
    () => groups.map((group) => group.representative),
    [groups],
  );
  const runsByRepresentative = useMemo(
    () => new Map(groups.map((group) => [group.representative.id, group.runs])),
    [groups],
  );
  const runsFor = useCallback(
    (id: string): TestRun[] => runsByRepresentative.get(id) ?? [],
    [runsByRepresentative],
  );
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // the grid reads its density prop once, so later changes go through the api
  useEffect(() => {
    apiRef.current?.setDensity?.(density);
  }, [apiRef, density]);

  const columns = useMemo(
    () => buildColumns(runsFor, tagFieldsFor, noiseAvailable),
    [runsFor, tagFieldsFor, noiseAvailable],
  );

  const tableSelectionModel = useMemo(
    () =>
      grouped
        ? groups
            .filter((group) =>
              group.runs.every((run) => selectedIdSet.has(run.id)),
            )
            .map((group) => group.representative.id)
        : selectedIds,
    [grouped, groups, selectedIds, selectedIdSet],
  );

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
      onSelectionChange(
        grouped
          ? ticked.flatMap((id) => runsFor(id).map((run) => run.id))
          : ticked,
      );
    },
    [rows, grouped, runsFor, onSelectionChange],
  );

  const onRowClick = useCallback(
    (param: GridRowParams<TestRun>) => onOpen(String(param.row.id)),
    [onOpen],
  );

  return (
    <DataGrid
      apiRef={apiRef}
      rows={rows}
      columns={columns}
      columnVisibilityModel={HIDDEN_COLUMNS}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      paginationModel={paginationModel}
      onPaginationModelChange={onPaginationModelChange}
      pagination
      loading={loading}
      density={density}
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
    />
  );
};
