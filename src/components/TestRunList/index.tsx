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
  ColDef,
  RowParams,
  CellParams,
} from "@material-ui/data-grid";
import { DataGridCustomToolbar } from "./DataGridCustomToolbar";
import { StatusFilterOperators } from "./StatusFilterOperators";
import { TagFilterOperators } from "./TagFilterOperators";

const columnsDef: ColDef[] = [
  { field: "id", hide: true, filterable: false },
  { field: "name", headerName: "Name", flex: 1 },
  {
    field: "tags",
    headerName: "Tags",
    flex: 1,
    valueGetter: (params: CellParams) => {
      const tags: Array<string> = [
        params.row["os"],
        params.row["device"],
        params.row["browser"],
        params.row["viewport"],
      ];
      return tags.reduce(
        (prev, curr) => prev.concat(curr ? `${curr};` : ""),
        ""
      );
    },
    renderCell: (params: CellParams) => (
      <React.Fragment>
        {params
          .getValue("tags")
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
    renderCell: (params: CellParams) => {
      return <TestStatusChip status={params.getValue("status")?.toString()} />;
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
          showToolbar={true}
          components={{
            Toolbar: DataGridCustomToolbar,
          }}
          checkboxSelection
          disableColumnSelector
          disableColumnMenu
          disableSelectionOnClick
          onRowClick={(param: RowParams) => {
            selectTestRun(testRunDispatch, param.getValue("id")?.toString());
          }}
        />
      )}
    </React.Fragment>
  );
};

export default TestRunList;
