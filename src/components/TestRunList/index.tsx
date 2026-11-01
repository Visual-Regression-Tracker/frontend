import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
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
import { useHotkeys } from "react-hotkeys-hook";
import {
  DataGrid,
  DataGridProps,
  useGridApiRef,
  GridCellParams,
  GridColDef,
  GridRowParams,
  GridRenderCellParams,
  GridSortDirection,
  GridSortModel,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { DataGridCustomToolbar } from "./DataGridCustomToolbar";
import { EmptyState } from "../EmptyState";
import { ViewListOutlined } from "@mui/icons-material";
import { BulkOperation } from "./BulkOperation";
import { TestRunGrid } from "./TestRunGrid";
import {
  TestRunDensity,
  TestRunListControls,
  TestRunView,
} from "./TestRunListControls";
import {
  DEFAULT_SORT,
  SORT_FIELDS,
  TestRunGridHeader,
  TestRunSort,
} from "./TestRunGridHeader";
import TestRunFilters from "./TestRunFilters";
import { TestRun, TestStatus } from "../../types";
import { testRunService } from "../../services";
import { useNavigate } from "react-router-dom";
import { buildTestRunLocation } from "../../_helpers/route.helpers";
import { TEST_RUN_SHOW_DIFF_KEY } from "../../constants";
import {
  groupStatusSummary,
  groupTestRuns,
  resolveGroupByAxis,
  singleRunGroups,
} from "../../_helpers/testRunGroup.helper";
import {
  byAttention,
  statusesByAttention,
} from "../../_helpers/testRunStatus.helper";
import { TAG_FIELDS, tagsOf } from "../../_helpers/testRunTags.helper";

const HIDDEN_COLUMNS = { id: false };

const buildColumns = (
  runsFor: (id: string) => TestRun[],
  tagFieldsFor: (runCount: number) => Array<keyof TestRun>,
): GridColDef[] => [
  {
    field: "id",
    filterable: false,
  },
  {
    field: "name",
    headerName: "Name",
    // Data Grid 7 does not centre a custom cell on its own
    display: "flex",
    flex: 1,
    filterable: false,
    renderCell: (params: GridRenderCellParams) => {
      const count = runsFor(params.row["id"]).length;

      return (
        <Box display="flex" alignItems="center" gap={0.5} minWidth={0}>
          <Typography variant="body2" noWrap title={params.row["name"]}>
            {params.row["name"]}
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
    valueGetter: (_value, row) =>
      tagFieldsFor(runsFor(row["id"]).length)
        .map((field) => row[field])
        .reduce((prev, curr) => prev.concat(curr ? `${curr};` : ""), ""),
    renderCell: (params: GridCellParams) => (
      <Fragment>
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
      </Fragment>
    ),
  },
  {
    field: "status",
    headerName: "Status",
    display: "flex",
    flex: 0.3,
    filterable: false,
    // the chip shows the representative only, so the title gives the whole group
    renderCell: (params: GridRenderCellParams) => (
      <Box
        component="span"
        title={groupStatusSummary(runsFor(params.row["id"])) || undefined}
      >
        <TestStatusChip status={params.row["status"]?.toString()} />
      </Box>
    ),
  },
];

const PAGE_SIZE_OPTIONS = [10, 30, 100];

// the rows always follow some sort, so the header cannot offer "unsorted"
const SORTING_ORDER: GridSortDirection[] = ["asc", "desc"];

const byName = (a: TestRun, b: TestRun): number => a.name.localeCompare(b.name);

// ascending runs ok to new: descending puts needs-attention first in both views
const bySettled = (a: TestRun, b: TestRun): number => -byAttention(a, b);

// flip only the chosen field: negating the tie-break too would reverse names
const comparatorFor = (
  sort: TestRunSort,
  tagFieldsOf: (run: TestRun) => Array<keyof TestRun>,
) => {
  const tagKeys = new Map<TestRun, string>();
  const tagKey = (run: TestRun): string => {
    let key = tagKeys.get(run);
    if (key === undefined) {
      key = tagsOf(run, tagFieldsOf(run));
      tagKeys.set(run, key);
    }
    return key;
  };
  const ascendingBy = (a: TestRun, b: TestRun): number => {
    if (sort.field === "status") {
      return bySettled(a, b);
    }
    if (sort.field === "name") {
      return byName(a, b);
    }
    return tagKey(a).localeCompare(tagKey(b));
  };

  return (a: TestRun, b: TestRun): number => {
    const ascending = ascendingBy(a, b);
    const primary = sort.direction === "asc" ? ascending : -ascending;
    const tieBreak = sort.field === "name" ? byAttention(a, b) : byName(a, b);

    return primary || tieBreak;
  };
};

// the grid only reports header clicks; the order itself is ours
const sortOfModel = (model: GridSortModel): TestRunSort | undefined => {
  const [item] = model;
  const field = SORT_FIELDS.find((candidate) => candidate === item?.field);
  if (!item?.sort || !field) {
    return undefined;
  }
  return { field, direction: item.sort };
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

const TestRunList = () => {
  const apiRef = useGridApiRef();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { selectedTestRun, filteredSortedTestRunIds, testRuns, loading } =
    useTestRunState();
  const { selectedBuild } = useBuildState();
  const { selectedProjectId, projectList } = useProjectState();
  const testRunDispatch = useTestRunDispatch();

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>([
    {
      field: "status",
      sort: "desc",
    },
  ]);

  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<TestStatus[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [view, setView] = useState<TestRunView>("table");
  const [density, setDensity] = useState<TestRunDensity>("standard");
  const [groupVariations, setGroupVariations] = useState(false);
  const [showDiff, setShowDiff] = useState(
    () => localStorage.getItem(TEST_RUN_SHOW_DIFF_KEY) !== "false",
  );
  useEffect(() => {
    localStorage.setItem(TEST_RUN_SHOW_DIFF_KEY, String(showDiff));
  }, [showDiff]);

  const [gridSort, setGridSort] = useState<TestRunSort>(DEFAULT_SORT);

  useHotkeys("d", () => setShowDiff((prev) => !prev), {
    enabled: view === "grid" && !selectedTestRun,
  });

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // every filtered run, not just the page: the table's header box does the same
  const toggleAll = useCallback(
    (ids: string[]) =>
      setSelectedIds((prev) => {
        const previous = new Set(prev);
        return ids.every((id) => previous.has(id)) ? [] : ids;
      }),
    [],
  );

  // the list stays mounted across builds, so ticks must not carry over
  useEffect(() => {
    setSelectedIds([]);
  }, [selectedBuild?.id]);

  const toggleGroup = useCallback(
    (ids: string[]) =>
      setSelectedIds((prev) => {
        const previous = new Set(prev);
        if (ids.every((id) => previous.has(id))) {
          const dropped = new Set(ids);
          return prev.filter((id) => !dropped.has(id));
        }
        return Array.from(new Set([...prev, ...ids]));
      }),
    [],
  );

  // the grid reads its density prop once, so later changes go through the api
  useEffect(() => {
    apiRef.current?.setDensity?.(density);
  }, [apiRef, density, view]);

  const toggleTag = useCallback(
    (tag: string) =>
      setTagFilter((prev) =>
        prev.includes(tag)
          ? prev.filter((item) => item !== tag)
          : [...prev, tag],
      ),
    [],
  );

  const resetFilters = useCallback(() => {
    setNameFilter("");
    setStatusFilter([]);
    setTagFilter([]);
  }, []);

  const tagFieldByValue = useMemo(() => {
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

  const selectedTagsByField = useMemo(() => {
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
  const tagGroups = useMemo(
    () => Array.from(selectedTagsByField.entries()),
    [selectedTagsByField],
  );

  const filteredRows = useMemo(
    () =>
      testRuns.filter(
        (run) =>
          matchesNameQuery(run, query) &&
          matchesStatuses(run, statusFilter) &&
          matchesTagGroups(run, tagGroups),
      ),
    [testRuns, query, statusFilter, tagGroups],
  );

  const activeSort = useMemo(
    () => (view === "grid" ? gridSort : (sortOfModel(sortModel) ?? gridSort)),
    [view, gridSort, sortModel],
  );

  const sortedRows = useMemo(
    () => [...filteredRows].sort(comparatorFor(activeSort, () => TAG_FIELDS)),
    [filteredRows, activeSort],
  );

  const groupByAxis = useMemo(
    () =>
      resolveGroupByAxis(
        projectList.find((item) => item.id === selectedProjectId)
          ?.bulkApproveGroupBy,
      ),
    [projectList, selectedProjectId],
  );

  const groups = useMemo(
    () =>
      groupVariations
        ? groupTestRuns(sortedRows, groupByAxis)
        : singleRunGroups(sortedRows),
    [groupVariations, sortedRows, groupByAxis],
  );

  const runsByRepresentative = useMemo(
    () => new Map(groups.map((group) => [group.representative.id, group.runs])),
    [groups],
  );

  const runsFor = useCallback(
    (id: string): TestRun[] => runsByRepresentative.get(id) ?? [],
    [runsByRepresentative],
  );

  // the grouped axis varies within a group, so it tags only a group of one
  const tagFieldsFor = useCallback(
    (runCount: number): Array<keyof TestRun> =>
      groupVariations && runCount > 1
        ? TAG_FIELDS.filter((field) => field !== groupByAxis)
        : TAG_FIELDS,
    [groupVariations, groupByAxis],
  );

  const columns = useMemo(
    () => buildColumns(runsFor, tagFieldsFor),
    [runsFor, tagFieldsFor],
  );

  // a group's place follows its representative, which is not its first run in the order
  const shownRows = useMemo(() => {
    if (!groupVariations) {
      return sortedRows;
    }
    const representatives = groups.map((group) => group.representative);
    return view === "grid"
      ? representatives
      : representatives.sort(
          comparatorFor(activeSort, (row) =>
            tagFieldsFor(runsFor(row.id).length),
          ),
        );
  }, [
    groupVariations,
    sortedRows,
    groups,
    view,
    activeSort,
    tagFieldsFor,
    runsFor,
  ]);

  const tableSelectionModel = useMemo(
    () =>
      groupVariations
        ? groups
            .filter((group) =>
              group.runs.every((run) => selectedIdSet.has(run.id)),
            )
            .map((group) => group.representative.id)
        : selectedIds,
    [groupVariations, groups, selectedIds, selectedIdSet],
  );

  // a stable object, so the grid does not re-sync on every render
  const rowSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({ type: "include", ids: new Set(tableSelectionModel) }),
    [tableSelectionModel],
  );

  const selectedCardCount = useMemo(
    () =>
      groups.filter((group) =>
        group.runs.some((run) => selectedIdSet.has(run.id)),
      ).length,
    [groups, selectedIdSet],
  );

  // clamped, not corrected in state: grouping changes the page count under it
  const gridPageCount = Math.max(
    1,
    Math.ceil(groups.length / paginationModel.pageSize),
  );
  const gridPage = Math.min(paginationModel.page, gridPageCount - 1);
  const pagedGroups = groups.slice(
    gridPage * paginationModel.pageSize,
    (gridPage + 1) * paginationModel.pageSize,
  );

  // options come from rows matching the OTHER filters: each one returns results
  const statusOptions = useMemo(() => {
    const present = new Set<TestStatus>(statusFilter);
    testRuns.forEach((run) => {
      if (matchesNameQuery(run, query) && matchesTagGroups(run, tagGroups)) {
        present.add(run.status);
      }
    });
    return statusesByAttention(Array.from(present));
  }, [testRuns, query, tagGroups, statusFilter]);

  const tagOptions = useMemo(() => {
    const present = new Set<string>(tagFilter);
    testRuns.forEach((run) => {
      if (matchesNameQuery(run, query) && matchesStatuses(run, statusFilter)) {
        // read fields off the run: an array per run allocates on every keystroke
        TAG_FIELDS.forEach((field) => {
          const value = run[field];
          if (typeof value === "string" && value) {
            present.add(value);
          }
        });
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

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [nameFilter, statusFilter, tagFilter]);

  useEffect(() => {
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

  useEffect(() => {
    // switching builds outruns the answers, and only the open build's may land
    let ignore = false;

    testRunDispatch({
      type: "request",
    });
    if (selectedBuild?.id) {
      testRunService
        .getList(selectedBuild.id)
        .then((payload) => {
          if (!ignore) {
            testRunDispatch({
              type: "get",
              payload,
            });
          }
        })
        .catch((err: string) => {
          if (!ignore) {
            testRunDispatch({ type: "failure" });
            enqueueSnackbar(err, {
              variant: "error",
            });
          }
        });
    } else {
      testRunDispatch({
        type: "get",
        payload: [],
      });
    }

    return () => {
      ignore = true;
    };
  }, [testRunDispatch, enqueueSnackbar, selectedBuild?.id]);

  // the arrow order: the rows on screen with groups expanded, frozen while open
  const navigationIds = useMemo(
    () => shownRows.flatMap((row) => runsFor(row.id).map((item) => item.id)),
    [shownRows, runsFor],
  );

  // a link opens the dialog before the list loads: publish the first order, then hold it
  useEffect(() => {
    if (!selectedTestRun || filteredSortedTestRunIds === undefined) {
      testRunDispatch({ type: "filterSort", payload: navigationIds });
    }
  }, [
    navigationIds,
    selectedTestRun,
    filteredSortedTestRunIds,
    testRunDispatch,
  ]);

  const gridSlotProps = useMemo<DataGridProps["slotProps"]>(
    () => ({
      toolbar: {
        selectedIds,
        rows: filteredRows,
        view,
        onViewChange: setView,
        density,
        onDensityChange: setDensity,
        grouped: groupVariations,
        onGroupedChange: setGroupVariations,
        groupByAxis,
        showDiff,
        onShowDiffChange: setShowDiff,
        onProcessed: setSelectedIds,
      },
    }),
    [
      selectedIds,
      filteredRows,
      view,
      density,
      groupVariations,
      groupByAxis,
      showDiff,
    ],
  );

  const onRowSelectionModelChange = useCallback(
    (model: GridRowSelectionModel) => {
      // the header box selects everything as an exclude list
      const ticked =
        model.type === "include"
          ? [...model.ids].map(String)
          : shownRows.map((row) => row.id).filter((id) => !model.ids.has(id));
      setSelectedIds(
        groupVariations
          ? ticked.flatMap((id) => runsFor(id).map((run) => run.id))
          : ticked,
      );
    },
    [shownRows, groupVariations, runsFor],
  );

  const selectedBuildId = selectedBuild?.id;
  const openRun = useCallback(
    (id: string) => {
      if (selectedBuildId) {
        navigate(buildTestRunLocation(selectedBuildId, id));
      }
    },
    [navigate, selectedBuildId],
  );
  const onRowClick = useCallback(
    (param: GridRowParams) => openRun(String(param.row["id"])),
    [openRun],
  );

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
              rows={shownRows}
              columns={columns}
              columnVisibilityModel={HIDDEN_COLUMNS}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pagination
              loading={loading}
              slots={{
                toolbar: DataGridCustomToolbar,
              }}
              showToolbar
              density={density}
              slotProps={gridSlotProps}
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={onRowSelectionModelChange}
              checkboxSelection
              disableColumnSelector
              disableColumnMenu
              disableRowSelectionOnClick
              sortingMode="server"
              sortingOrder={SORTING_ORDER}
              sortModel={sortModel}
              onSortModelChange={setSortModel}
              onRowClick={onRowClick}
            />
          ) : (
            // framed like the data grid; text.primary stops the body's black reading heavier
            <Box
              height="100%"
              display="flex"
              flexDirection="column"
              border={1}
              borderColor="divider"
              borderRadius={1}
              color="text.primary"
            >
              <Toolbar variant="dense">
                <TestRunListControls
                  view={view}
                  onViewChange={setView}
                  density={density}
                  onDensityChange={setDensity}
                  grouped={groupVariations}
                  onGroupedChange={setGroupVariations}
                  groupByAxis={groupByAxis}
                  showDiff={showDiff}
                  onShowDiffChange={setShowDiff}
                />
                <Box marginLeft="auto">
                  <BulkOperation
                    selectedIds={selectedIds}
                    rows={sortedRows}
                    selectionNoun="cards"
                    onProcessed={setSelectedIds}
                  />
                </Box>
              </Toolbar>
              <TestRunGridHeader
                sort={gridSort}
                onSortChange={setGridSort}
                density={density}
                selectedCount={
                  navigationIds.filter((id) => selectedIdSet.has(id)).length
                }
                totalCount={navigationIds.length}
                onToggleAll={() => toggleAll(navigationIds)}
              />
              {loading && <LinearProgress />}
              <Box flex={1} overflow="auto">
                {sortedRows.length === 0 ? (
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
                    selectedIdSet={selectedIdSet}
                    density={density}
                    showDiff={showDiff}
                    activeTags={tagFilter}
                    tagFieldsFor={tagFieldsFor}
                    onToggleGroup={toggleGroup}
                    onToggleTag={toggleTag}
                    onOpen={openRun}
                  />
                )}
              </Box>
              <Box
                display="flex"
                alignItems="center"
                borderTop={1}
                borderColor="divider"
              >
                {selectedCardCount > 0 && (
                  <Typography
                    variant="body2"
                    marginLeft={2}
                    data-testid="gridSelectionCount"
                  >
                    {selectedCardCount === 1
                      ? "1 card selected"
                      : `${selectedCardCount} cards selected`}
                  </Typography>
                )}
                <Box marginLeft="auto">
                  <TablePagination
                    component="div"
                    count={groups.length}
                    page={gridPage}
                    rowsPerPage={paginationModel.pageSize}
                    rowsPerPageOptions={PAGE_SIZE_OPTIONS}
                    labelRowsPerPage="Cards per page:"
                    onPageChange={(_event, next) =>
                      setPaginationModel((prev) => ({ ...prev, page: next }))
                    }
                    onRowsPerPageChange={(event) =>
                      setPaginationModel({
                        page: 0,
                        pageSize: Number(event.target.value),
                      })
                    }
                  />
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <EmptyState
      icon={<ViewListOutlined />}
      title="Select a build"
      description="Pick a build in the list on the left to review its test runs."
    />
  );
};

export default TestRunList;
