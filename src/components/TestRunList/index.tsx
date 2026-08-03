import React from "react";
import { Box, Chip, LinearProgress, Toolbar, Typography } from "@mui/material";
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
  GridCellParams,
  GridColDef,
  GridRowParams,
  GridValueGetterParams,
  GridRenderCellParams,
  GridSortDirection,
  GridSortModel,
  gridFilteredSortedRowIdsSelector,
} from "@mui/x-data-grid";
import { DataGridCustomToolbar } from "./DataGridCustomToolbar";
import { BulkOperation } from "./BulkOperation";
import { TestRunGrid } from "./TestRunGrid";
import {
  TestRunDensity,
  TestRunListControls,
  TestRunView,
} from "./TestRunListControls";
import TestRunFilters from "./TestRunFilters";
import { TestRun, TestStatus } from "../../types";
import { testRunService } from "../../services";
import { useNavigate } from "react-router";
import { buildTestRunLocation } from "../../_helpers/route.helpers";
import { TEST_RUN_DENSITY_KEY, TEST_RUN_VIEW_KEY } from "../../constants";

// https://mui.com/x/react-data-grid/column-definition/
const columnsDef: GridColDef[] = [
  {
    field: "id",
    filterable: false,
  },
  {
    field: "name",
    headerName: "Name",
    flex: 1,
    filterable: false,
  },
  {
    field: "tags",
    headerName: "Tags",
    flex: 1,
    filterable: false,
    valueGetter: (params: GridValueGetterParams) => {
      const tags: string[] = [
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
        {params.formattedValue
          ?.toString()
          .split(";")
          .map(
            (tag: string | null) =>
              tag && (
                <Chip
                  key={tag}
                  size="small"
                  label={tag}
                  style={{
                    margin: "1px",
                  }}
                />
              ),
          )}
      </React.Fragment>
    ),
  },
  {
    field: "status",
    headerName: "Status",
    flex: 0.3,
    filterable: false,
    renderCell: (params: GridRenderCellParams) => (
      <TestStatusChip status={params.row["status"]?.toString()} />
    ),
    sortComparator: (v1: TestStatus, v2: TestStatus) => {
      const statusOrder = Object.values(TestStatus);
      return statusOrder.indexOf(v2) - statusOrder.indexOf(v1);
    },
  },
];

const TAG_FIELDS: Array<keyof TestRun> = [
  "os",
  "device",
  "browser",
  "viewport",
  "customTags",
];

const STATUS_ORDER = Object.values(TestStatus);

type TagGroups = Array<[keyof TestRun, Set<string>]>;

const matchesNameQuery = (run: TestRun, query: string): boolean =>
  !query || run.name.toLowerCase().includes(query);

const matchesStatuses = (run: TestRun, statuses: TestStatus[]): boolean =>
  statuses.length === 0 || statuses.includes(run.status);

const matchesTagGroups = (run: TestRun, groups: TagGroups): boolean =>
  groups.every(([field, values]) => values.has(String(run[field] ?? "")));

const runTagValues = (run: TestRun): string[] =>
  TAG_FIELDS.map((field) => run[field]).filter(
    (v): v is string => typeof v === "string" && Boolean(v),
  );

const TestRunList: React.FunctionComponent = () => {
  const apiRef = useGridApiRef();
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

  const [nameFilter, setNameFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<TestStatus[]>([]);
  const [tagFilter, setTagFilter] = React.useState<string[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [view, setView] = React.useState<TestRunView>(() =>
    localStorage.getItem(TEST_RUN_VIEW_KEY) === "grid" ? "grid" : "table",
  );
  const [density, setDensity] = React.useState<TestRunDensity>(() => {
    const stored = localStorage.getItem(TEST_RUN_DENSITY_KEY);
    return stored === "compact" || stored === "comfortable"
      ? stored
      : "standard";
  });

  const toggleSelect = React.useCallback(
    (id: string) =>
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      ),
    [],
  );

  React.useEffect(() => {
    localStorage.setItem(TEST_RUN_VIEW_KEY, view);
  }, [view]);

  React.useEffect(() => {
    localStorage.setItem(TEST_RUN_DENSITY_KEY, density);
  }, [density]);

  // the data grid takes its density prop as an initial value only, so later
  // changes have to go through the api
  React.useEffect(() => {
    apiRef.current?.setDensity?.(density);
  }, [apiRef, density, view]);

  const resetFilters = React.useCallback(() => {
    setNameFilter("");
    setStatusFilter([]);
    setTagFilter([]);
  }, []);

  const tagFieldByValue = React.useMemo(() => {
    const map = new Map<string, keyof TestRun>();
    testRuns.forEach((run) => {
      TAG_FIELDS.forEach((field) => {
        const value = run[field];
        if (typeof value === "string" && value) {
          map.set(value, field);
        }
      });
    });
    return map;
  }, [testRuns]);

  const selectedTagsByField = React.useMemo(() => {
    const grouped = new Map<keyof TestRun, Set<string>>();
    tagFilter.forEach((tag) => {
      const field = tagFieldByValue.get(tag);
      if (!field) {
        return;
      }
      const values = grouped.get(field) ?? new Set<string>();
      values.add(tag);
      grouped.set(field, values);
    });
    return grouped;
  }, [tagFilter, tagFieldByValue]);

  const query = nameFilter.trim().toLowerCase();
  const tagGroups = React.useMemo(
    () => Array.from(selectedTagsByField.entries()),
    [selectedTagsByField],
  );

  const filteredRows = React.useMemo(
    () =>
      testRuns.filter(
        (run) =>
          matchesNameQuery(run, query) &&
          matchesStatuses(run, statusFilter) &&
          matchesTagGroups(run, tagGroups),
      ),
    [testRuns, query, statusFilter, tagGroups],
  );

  // needs attention first: STATUS_ORDER starts at new/unresolved/failed
  const gridRows = React.useMemo(
    () =>
      [...filteredRows].sort(
        (a, b) =>
          STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
          a.name.localeCompare(b.name),
      ),
    [filteredRows],
  );

  // Options for each filter are derived from rows matching all OTHER filters,
  // so only values that would actually return results are offered.
  const statusOptions = React.useMemo(() => {
    const present = new Set<TestStatus>(statusFilter);
    testRuns.forEach((run) => {
      if (matchesNameQuery(run, query) && matchesTagGroups(run, tagGroups)) {
        present.add(run.status);
      }
    });
    return Array.from(present).sort(
      (a, b) => STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b),
    );
  }, [testRuns, query, tagGroups, statusFilter]);

  const tagOptions = React.useMemo(() => {
    const present = new Set<string>(tagFilter);
    testRuns.forEach((run) => {
      if (matchesNameQuery(run, query) && matchesStatuses(run, statusFilter)) {
        runTagValues(run).forEach((value) => present.add(value));
      }
    });
    const fieldIndex = (value: string): number => {
      const field = tagFieldByValue.get(value);
      return field ? TAG_FIELDS.indexOf(field) : TAG_FIELDS.length;
    };
    return Array.from(present).sort(
      (a, b) => fieldIndex(a) - fieldIndex(b) || a.localeCompare(b),
    );
  }, [testRuns, query, statusFilter, tagFilter, tagFieldByValue]);

  React.useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [nameFilter, statusFilter, tagFilter]);

  // Drop selected filter values that no longer exist in the data
  // (e.g. after their test runs were deleted).
  React.useEffect(() => {
    if (testRuns.length === 0) {
      return;
    }
    const existingTags = new Set<string>();
    const existingStatuses = new Set<TestStatus>();
    testRuns.forEach((run) => {
      runTagValues(run).forEach((value) => existingTags.add(value));
      existingStatuses.add(run.status);
    });
    setTagFilter((prev) => {
      const next = prev.filter((tag) => existingTags.has(tag));
      return next.length === prev.length ? prev : next;
    });
    setStatusFilter((prev) => {
      const next = prev.filter((status) => existingStatuses.has(status));
      return next.length === prev.length ? prev : next;
    });
  }, [testRuns]);

  const getTestRunListCallback = React.useCallback(() => {
    testRunDispatch({
      type: "request",
    });
    if (selectedBuild?.id) {
      testRunService
        .getList(selectedBuild.id)
        .then((payload) =>
          testRunDispatch({
            type: "get",
            payload,
          }),
        )
        .catch((err: string) =>
          enqueueSnackbar(err, {
            variant: "error",
          }),
        );
    } else {
      testRunDispatch({
        type: "get",
        payload: [],
      });
    }
  }, [testRunDispatch, enqueueSnackbar, selectedBuild?.id]);

  React.useEffect(() => {
    getTestRunListCallback();
  }, [getTestRunListCallback]);

  // workaround https://github.com/mui/mui-x/issues/1106
  React.useEffect(() => {
    let unsubscribe: () => void;
    const handleStateChange = () => {
      unsubscribe?.();
      if (!selectedTestRun) {
        testRunDispatch({
          type: "filterSort",
          payload: gridFilteredSortedRowIdsSelector(apiRef),
        });
      }
      unsubscribe?.();
    };
    return apiRef.current?.subscribeEvent?.(
      "stateChange",
      () =>
        (unsubscribe = apiRef.current?.subscribeEvent(
          "stateChange",
          handleStateChange,
        )),
    );
  }, [apiRef, apiRef.current?.instanceId]);

  // the data grid publishes the order the details dialog navigates; with the
  // grid view mounted instead, it has to publish its own
  React.useEffect(() => {
    if (view === "grid" && !selectedTestRun) {
      testRunDispatch({
        type: "filterSort",
        payload: gridRows.map((run) => run.id),
      });
    }
  }, [view, gridRows, selectedTestRun, testRunDispatch]);

  if (selectedBuild) {
    return (
      <Box display="flex" flexDirection="column" height="100%">
        <Box paddingX={2} paddingTop={1} paddingBottom={1}>
          <TestRunFilters
            tagOptions={tagOptions}
            statusOptions={statusOptions}
            name={nameFilter}
            statuses={statusFilter}
            tags={tagFilter}
            onNameChange={setNameFilter}
            onStatusesChange={setStatusFilter}
            onTagsChange={setTagFilter}
            onReset={resetFilters}
          />
        </Box>
        <Box flex={1} minHeight={0}>
          {view === "table" ? (
            <DataGrid
              apiRef={apiRef}
              rows={filteredRows}
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
              density={density}
              slotProps={{
                toolbar: {
                  selectedIds,
                  rows: filteredRows,
                  view,
                  onViewChange: setView,
                  density,
                  onDensityChange: setDensity,
                },
              }}
              rowSelectionModel={selectedIds}
              onRowSelectionModelChange={(model) =>
                setSelectedIds(model.map(String))
              }
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
                    param.row["id"].toString(),
                  ),
                );
              }}
            />
          ) : (
            <Box height="100%" display="flex" flexDirection="column">
              <Toolbar variant="dense">
                <TestRunListControls
                  view={view}
                  onViewChange={setView}
                  density={density}
                  onDensityChange={setDensity}
                />
                <Box marginLeft="auto">
                  <BulkOperation selectedIds={selectedIds} rows={gridRows} />
                </Box>
              </Toolbar>
              {loading && <LinearProgress />}
              <Box flex={1} overflow="auto">
                {gridRows.length === 0 ? (
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
                    rows={gridRows}
                    selectedIds={selectedIds}
                    density={density}
                    onToggleSelect={toggleSelect}
                    onOpen={(id) =>
                      navigate(buildTestRunLocation(selectedBuild.id, id))
                    }
                  />
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  return <Typography variant="h5">Select build from list</Typography>;
};

export default TestRunList;
