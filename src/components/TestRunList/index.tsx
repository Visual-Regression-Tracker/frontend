import React from "react";
import { Chip, Typography } from "@mui/material";
import TestStatusChip from "../TestStatusChip";
import {
  useTestRunState,
  useTestRunDispatch,
  useBuildState,
} from "../../contexts";
import { useSnackbar } from "notistack";
import {
  DataGrid,
  useGridApiRef,
  type GridCellParams,
  type GridColDef,
  type GridRowParams,
  type GridValueGetterParams,
  type GridRenderCellParams,
  type GridSortDirection,
  type GridSortModel,
} from "@mui/x-data-grid";
import { DataGridCustomToolbar } from "./DataGridCustomToolbar";
import { StatusFilterOperators } from "./StatusFilterOperators";
import { TagFilterOperators } from "./TagFilterOperators";
import { TestStatus } from "../../types";
import { testRunService } from "../../services";
import { useNavigate } from "react-router";
import { buildTestRunLocation } from "../../_helpers/route.helpers";

const columnsDef: GridColDef[] = [
  { field: "id", filterable: false },
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
        "",
      );
    },
    renderCell: (params: GridCellParams) => (
      <React.Fragment>
        {params.row["tags"]
          ?.toString()
          .split(";")
          .map(
            (tag: any) =>
              tag && (
                <Chip
                  key={tag}
                  size="small"
                  label={tag}
                  style={{ margin: "1px" }}
                />
              ),
          )}
      </React.Fragment>
    ),
    filterOperators: TagFilterOperators,
  },
  {
    field: "status",
    headerName: "Status",
    flex: 0.3,
    renderCell: (params: GridRenderCellParams) => {
      return <TestStatusChip status={params.row["status"]?.toString()} />;
    },
    sortComparator: (v1: TestStatus, v2: TestStatus) => {
      const statusOrder = Object.values(TestStatus);
      return statusOrder.indexOf(v2) - statusOrder.indexOf(v1);
    },
    filterOperators: StatusFilterOperators,
  },
];

const TestRunList: React.FunctionComponent = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { selectedTestRun, testRuns, loading } = useTestRunState();
  const { selectedBuild } = useBuildState();
  const testRunDispatch = useTestRunDispatch();

  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });

  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    {
      field: "status",
      sort: "desc" as GridSortDirection,
    },
  ]);

  const getTestRunListCallback = React.useCallback(() => {
    testRunDispatch({ type: "request" });
    if (selectedBuild?.id) {
      testRunService
        .getList(selectedBuild.id)
        .then((payload) => testRunDispatch({ type: "get", payload }))
        .catch((err: string) =>
          enqueueSnackbar(err, {
            variant: "error",
          }),
        );
    } else {
      testRunDispatch({ type: "get", payload: [] });
    }
  }, [testRunDispatch, enqueueSnackbar, selectedBuild?.id]);

  React.useEffect(() => {
    getTestRunListCallback();
  }, [getTestRunListCallback]);
  const apiRef = useGridApiRef();

  if (selectedBuild) {
    return (
      <>
        <DataGrid
          apiRef={apiRef}
          rows={testRuns}
          columns={columnsDef}
          columnVisibilityModel={{
            id: false,
          }}
          pageSizeOptions={[10, 30, 100]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pagination
          loading={loading}
          slots={{
            toolbar: DataGridCustomToolbar,
          }}
          checkboxSelection
          disableColumnSelector
          disableColumnMenu
          disableRowSelectionOnClick
          sortModel={sortModel}
          onSortModelChange={(model) => setSortModel(model)}
          onRowClick={(param: GridRowParams) => {
            navigate(
              buildTestRunLocation(
                selectedBuild.id,
                param.row["id"]?.toString(),
              ),
            );
          }}
          onStateChange={(state) => {
            if (!selectedTestRun) {
              // only if testRun modal is not shown
              testRunDispatch({
                type: "filter",
                payload: state.visibleRows,
              });
              testRunDispatch({
                type: "sort",
                payload: state.sorting.sortedRows,
              });
            }
          }}
        />
      </>
    );
  }
  return (
    <>
      <Typography variant="h5">Select build from list</Typography>
    </>
  );
};

export default TestRunList;
