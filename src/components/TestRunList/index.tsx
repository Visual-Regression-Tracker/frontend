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
  GridFilterModelParams,
} from "@material-ui/data-grid";
import { DataGridCustomToolbar } from "./DataGridCustomToolbar";
import { StatusFilterOperators } from "./StatusFilterOperators";
import { TagFilterOperators } from "./TagFilterOperators";
import { TestRun } from "../../types";

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
    filterOperators: StatusFilterOperators,
  },
];

const TestRunList: React.FunctionComponent = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { testRuns, loading } = useTestRunState();
  const { selectedBuildId } = useBuildState();
  const testRunDispatch = useTestRunDispatch();

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
          onRowClick={(param: GridRowParams) => {
            selectTestRun(
              testRunDispatch,
              param.getValue(param.id, "id")?.toString()
            );
          }}
          onFilterModelChange={(params: GridFilterModelParams) => {
            testRunDispatch({
              type: "filter",
              payload: Array.from(
                params.visibleRows.values()
              ) as Array<TestRun>,
            });
          }}
        />
      )}
    </React.Fragment>
  );
};

export default TestRunList;
