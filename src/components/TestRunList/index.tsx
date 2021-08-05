import React from "react";
import { Chip } from "@material-ui/core";
import TestStatusChip from "../TestStatusChip";
import {
  useTestRunState,
  useTestRunDispatch,
  getTestRunList,
  useBuildState,
  selectTestRun,
} from "../../contexts";
import { useSnackbar } from "notistack";
import {
  DataGrid,
  GridCellParams,
  GridColDef,
  GridRowParams,
  GridValueGetterParams,
  GridValueFormatterParams,
  GridCellValue,
  GridSortCellParams,
  GridStateChangeParams,
  GridSortDirection,
  GridSortModel,
} from "@material-ui/data-grid";
import { DataGridCustomToolbar } from "./DataGridCustomToolbar";
import { StatusFilterOperators } from "./StatusFilterOperators";
import { TagFilterOperators } from "./TagFilterOperators";
import { TestStatus } from "../../types";

const columnsDef: GridColDef[] = [
  { field: "id", hide: true, filterable: false },
  { field: "name", headerName: "Name", flex: 1 },
  {
    field: "tags",
    headerName: "Tags",
    flex: 1,
    valueGetter: (params: GridValueGetterParams) => {
      const tags: Array<string> = [
        params.row["os"],
        params.row["device"],
        params.row["browser"],
        params.row["viewport"],
        params.row["customTags"],
      ];
      return tags.reduce(
        (prev, curr) => prev.concat(curr ? `${curr};` : ""),
        ""
      );
    },
    renderCell: (params: GridCellParams) => (
      <React.Fragment>
        {params
          .getValue(params.id, "tags")
          ?.toString()
          .split(";")
          .map(
            (tag) =>
              tag && (
                <Chip
                  key={tag}
                  size="small"
                  label={tag}
                  style={{ margin: "1px" }}
                />
              )
          )}
      </React.Fragment>
    ),
    filterOperators: TagFilterOperators,
  },
  {
    field: "status",
    headerName: "Status",
    flex: 0.3,
    renderCell: (params: GridValueFormatterParams) => {
      return (
        <TestStatusChip
          status={params.getValue(params.id, "status")?.toString()}
        />
      );
    },
    sortComparator: (
      v1: GridCellValue,
      v2: GridCellValue,
      cellParams1: GridSortCellParams,
      cellParams2: GridSortCellParams
    ) => {
      const statusOrder = Object.values(TestStatus);
      return (
        statusOrder.indexOf(v2 as TestStatus) -
        statusOrder.indexOf(v1 as TestStatus)
      );
    },
    filterOperators: StatusFilterOperators,
  },
];

const TestRunList: React.FunctionComponent = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { testRuns, loading } = useTestRunState();
  const { selectedBuildId } = useBuildState();
  const testRunDispatch = useTestRunDispatch();

  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    {
      field: "status",
      sort: "desc" as GridSortDirection,
    },
  ]);

  const getTestRunListCallback = React.useCallback(
    () =>
      selectedBuildId &&
      getTestRunList(testRunDispatch, selectedBuildId).catch((err: string) =>
        enqueueSnackbar(err, {
          variant: "error",
        })
      ),
    [testRunDispatch, enqueueSnackbar, selectedBuildId]
  );

  React.useEffect(() => {
    getTestRunListCallback();
  }, [getTestRunListCallback]);

  return (
    <React.Fragment>
      {selectedBuildId && (
        <DataGrid
          rows={testRuns}
          columns={columnsDef}
          pageSize={10}
          rowsPerPageOptions={[10, 20, 30]}
          loading={loading}
          components={{
            Toolbar: DataGridCustomToolbar,
          }}
          checkboxSelection
          disableColumnSelector
          disableColumnMenu
          disableSelectionOnClick
          sortModel={sortModel}
          onSortModelChange={(model) => setSortModel(model)}
          onRowClick={(param: GridRowParams) => {
            selectTestRun(
              testRunDispatch,
              param.getValue(param.id, "id")?.toString()
            );
          }}
          onStateChange={(props: GridStateChangeParams) => {
            testRunDispatch({
              type: "filter",
              payload: props.state.visibleRows.visibleRows,
            });
            testRunDispatch({
              type: "sort",
              payload: props.state.sorting.sortedRows,
            });
          }}
        />
      )}
    </React.Fragment>
  );
};

export default TestRunList;
