import React from "react";
import { Chip } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import TestStatusChip from "../TestStatusChip";
import { buildTestRunLocation } from "../../_helpers/route.helpers";
import {
  useTestRunState,
  useTestRunDispatch,
  getTestRunList,
  useBuildState,
} from "../../contexts";
import { useSnackbar } from "notistack";
import {
  DataGrid,
  ColDef,
  RowParams,
  CellParams,
  PageChangeParams,
} from "@material-ui/data-grid";
import { DataGridCustomToolbar } from "./DataGridCustomToolbar";

const columns: ColDef[] = [
  { field: "id", hide: true },
  { field: "name", headerName: "Name", flex: 1 },
  {
    field: "tags",
    headerName: "Tags",
    flex: 1,
    renderCell: (params: CellParams) => {
      const tags = [
        params.getValue("os")?.toString(),
        params.getValue("device")?.toString(),
        params.getValue("browser")?.toString(),
        params.getValue("viewport")?.toString(),
      ];
      return (
        <>
          {tags.map((tag) => tag && <Chip id={tag} size="small" label={tag} />)}
        </>
      );
    },
  },
  {
    field: "status",
    headerName: "Status",
    renderCell: (params: CellParams) => {
      return <TestStatusChip status={params.getValue("status")?.toString()} />;
    },
  },
];

const TestRunList: React.FunctionComponent = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { testRuns, loading, total, take } = useTestRunState();
  const { selectedBuildId } = useBuildState();
  const testRunDispatch = useTestRunDispatch();
  const history = useHistory();

  const getTestRunListCalback = React.useCallback(
    (page: number) =>
      selectedBuildId &&
      getTestRunList(testRunDispatch, selectedBuildId, page).catch(
        (err: string) =>
          enqueueSnackbar(err, {
            variant: "error",
          })
      ),
    [testRunDispatch, enqueueSnackbar, selectedBuildId]
  );

  React.useEffect(() => {
    getTestRunListCalback(1);
  }, [getTestRunListCalback]);

  return (
    <React.Fragment>
      <DataGrid
        rows={testRuns}
        columns={columns}
        pageSize={take}
        rowCount={total}
        loading={loading}
        paginationMode={"server"}
        showToolbar={true}
        components={{
          Toolbar: DataGridCustomToolbar,
        }}
        checkboxSelection
        disableColumnSelector
        disableColumnMenu
        disableSelectionOnClick
        onRowClick={(param: RowParams) => {
          history.push(
            buildTestRunLocation(
              param.getValue("buildId")?.toString() || "",
              param.getValue("id")?.toString() || ""
            )
          );
        }}
        onPageChange={(param: PageChangeParams) =>
          getTestRunListCalback(param.page)
        }
      />
    </React.Fragment>
  );
};

export default TestRunList;
