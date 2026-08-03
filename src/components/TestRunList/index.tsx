import React from "react";
import {
  Box,
  Chip,
  LinearProgress,
  TablePagination,
  Toolbar,
  Typography,
} from "@mui/material";
import TestStatusChip from "../TestStatusChip";
import {
  useTestRunState,
  useTestRunDispatch,
  useBuildState,
  useProjectState,
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
  DEFAULT_SORT,
  DEFAULT_SORT_DIRECTION,
  SORT_LABELS,
  TestRunDensity,
  TestRunListControls,
  TestRunSort,
  TestRunSortField,
  TestRunView,
} from "./TestRunListControls";
import TestRunFilters from "./TestRunFilters";
import { TestRun, TestStatus } from "../../types";
import { testRunService } from "../../services";
import { useNavigate } from "react-router";
import { buildTestRunLocation } from "../../_helpers/route.helpers";
import {
  TEST_RUN_DENSITY_KEY,
  TEST_RUN_GROUPED_KEY,
  TEST_RUN_SORT_KEY,
  TEST_RUN_VIEW_KEY,
} from "../../constants";
import {
  groupTestRuns,
  resolveGroupByAxis,
  singleRunGroups,
} from "../../_helpers/testRunGroup.helper";

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

const PAGE_SIZE_OPTIONS = [10, 30, 100];

const byName = (a: TestRun, b: TestRun): number => a.name.localeCompare(b.name);

// needs attention first: STATUS_ORDER starts at new/unresolved/failed
const byStatus = (a: TestRun, b: TestRun): number =>
  STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);

// ascending by field; the direction is applied by negating the result
const ASCENDING_BY_FIELD: Record<
  TestRunSortField,
  (a: TestRun, b: TestRun) => number
> = {
  status: (a, b) => byStatus(a, b) || byName(a, b),
  name: (a, b) => byName(a, b) || byStatus(a, b),
  diff: (a, b) => (a.diffPercent ?? 0) - (b.diffPercent ?? 0) || byName(a, b),
};

const comparatorFor =
  (sort: TestRunSort) =>
  (a: TestRun, b: TestRun): number => {
    const ascending = ASCENDING_BY_FIELD[sort.field](a, b);
    return sort.direction === "asc" ? ascending : -ascending;
  };

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
  const { selectedProjectId, projectList } = useProjectState();
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
  const [groupVariations, setGroupVariations] = React.useState(
    () => localStorage.getItem(TEST_RUN_GROUPED_KEY) !== "false",
  );
  const [gridSort, setGridSort] = React.useState<TestRunSort>(() => {
    const [field, direction] = (
      localStorage.getItem(TEST_RUN_SORT_KEY) ?? ""
    ).split(":");
    if (!(field in SORT_LABELS)) {
      return DEFAULT_SORT;
    }
    const sortField = field as TestRunSortField;
    return {
      field: sortField,
      direction:
        direction === "asc" || direction === "desc"
          ? direction
          : DEFAULT_SORT_DIRECTION[sortField],
    };
  });

  // a group is selected or cleared as a whole
  const toggleGroup = React.useCallback(
    (ids: string[]) =>
      setSelectedIds((prev) =>
        ids.every((id) => prev.includes(id))
          ? prev.filter((id) => !ids.includes(id))
          : Array.from(new Set([...prev, ...ids])),
      ),
    [],
  );

  React.useEffect(() => {
    localStorage.setItem(TEST_RUN_VIEW_KEY, view);
  }, [view]);

  React.useEffect(() => {
    localStorage.setItem(TEST_RUN_DENSITY_KEY, density);
  }, [density]);

  React.useEffect(() => {
    localStorage.setItem(TEST_RUN_GROUPED_KEY, String(groupVariations));
  }, [groupVariations]);

  React.useEffect(() => {
    localStorage.setItem(
      TEST_RUN_SORT_KEY,
      `${gridSort.field}:${gridSort.direction}`,
    );
  }, [gridSort]);

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

  const gridRows = React.useMemo(
    () => [...filteredRows].sort(comparatorFor(gridSort)),
    [filteredRows, gridSort],
  );

  const groups = React.useMemo(
    () =>
      groupVariations
        ? groupTestRuns(
            gridRows,
            resolveGroupByAxis(
              projectList.find((item) => item.id === selectedProjectId)
                ?.bulkApproveGroupBy,
            ),
          )
        : singleRunGroups(gridRows),
    [groupVariations, gridRows, projectList, selectedProjectId],
  );

  // the dialog walks the grid's runs in the grid's order, groups expanded, so
  // the arrows visit a screen's other locales before the next screen. Not
  // limited to the current page, matching how the table publishes every
  // filtered row rather than the visible ones.
  const groupedRunIds = React.useMemo(
    () => groups.flatMap((group) => group.runs.map((run) => run.id)),
    [groups],
  );

  // clamped rather than corrected in state: turning grouping off and on again
  // changes the card count under a page number that was valid a moment ago
  const gridPageCount = Math.max(
    1,
    Math.ceil(groups.length / paginationModel.pageSize),
  );
  const gridPage = Math.min(paginationModel.page, gridPageCount - 1);
  const pagedGroups = groups.slice(
    gridPage * paginationModel.pageSize,
    (gridPage + 1) * paginationModel.pageSize,
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
      testRunDispatch({ type: "filterSort", payload: groupedRunIds });
    }
  }, [view, groupedRunIds, selectedTestRun, testRunDispatch]);

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
              pageSizeOptions={PAGE_SIZE_OPTIONS}
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
                  grouped: groupVariations,
                  onGroupedChange: setGroupVariations,
                  sort: gridSort,
                  onSortChange: setGridSort,
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
            // framed like the data grid, so both views read as one widget
            <Box
              height="100%"
              display="flex"
              flexDirection="column"
              border={1}
              borderColor="divider"
              borderRadius={1}
            >
              <Toolbar
                variant="dense"
                sx={{ borderBottom: 1, borderColor: "divider" }}
              >
                <TestRunListControls
                  view={view}
                  onViewChange={setView}
                  density={density}
                  onDensityChange={setDensity}
                  grouped={groupVariations}
                  onGroupedChange={setGroupVariations}
                  sort={gridSort}
                  onSortChange={setGridSort}
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
                    groups={pagedGroups}
                    selectedIds={selectedIds}
                    density={density}
                    onToggleGroup={toggleGroup}
                    onOpen={(id) =>
                      navigate(buildTestRunLocation(selectedBuild.id, id))
                    }
                  />
                )}
              </Box>
              <TablePagination
                component="div"
                count={groups.length}
                page={gridPage}
                rowsPerPage={paginationModel.pageSize}
                rowsPerPageOptions={PAGE_SIZE_OPTIONS}
                labelRowsPerPage="Cards per page"
                onPageChange={(event, next) =>
                  setPaginationModel((prev) => ({ ...prev, page: next }))
                }
                onRowsPerPageChange={(event) =>
                  setPaginationModel({
                    page: 0,
                    pageSize: Number(event.target.value),
                  })
                }
                sx={{ borderTop: 1, borderColor: "divider" }}
              />
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  return <Typography variant="h5">Select build from list</Typography>;
};

export default TestRunList;
