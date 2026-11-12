import { useCallback, useEffect, useMemo, useState } from "react";
import { staleGuard } from "../../_helpers/staleGuard";
import { Box } from "@mui/material";
import {
  useTestRunState,
  useTestRunDispatch,
  useBuildState,
  useNoiseAnalysisAvailable,
  useSelectedProject,
} from "../../contexts";
import { useSnackbar } from "notistack";
import { GridSortModel } from "@mui/x-data-grid";
import { EmptyState } from "../EmptyState";
import { ViewListOutlined } from "@mui/icons-material";
import { TestRunCardView } from "./TestRunCardView";
import { TestRunListControls, TestRunView } from "./TestRunListControls";
import { BulkOperation } from "./BulkOperation";
import { DEFAULT_SORT } from "./TestRunGridToolbar";
import TestRunFilters from "./TestRunFilters";
import { TestRunTable } from "./TestRunTable";
import { useSharedTestRunFilters } from "./TestRunFiltersContext";
import { useTestRunSelection } from "./useTestRunSelection";
import type { TestRunSort } from "../../types/testRunSort";
import { sortOfModel } from "../../_helpers/testRunSort.helper";
import { testRunService } from "../../services";
import { useNavigate } from "react-router-dom";
import { buildTestRunLocation } from "../../_helpers/route.helpers";
import {
  groupTestRuns,
  resolveGroupByAxis,
  singleRunGroups,
  sortGroups,
} from "../../_helpers/testRunGroup.helper";

const DEFAULT_SORT_MODEL: GridSortModel = [
  { field: DEFAULT_SORT.field, sort: DEFAULT_SORT.direction },
];

const TestRunList = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { selectedTestRun, filteredSortedTestRunIds, loading } =
    useTestRunState();
  const { selectedBuild } = useBuildState();
  const testRunDispatch = useTestRunDispatch();

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>(DEFAULT_SORT_MODEL);

  const selectedProject = useSelectedProject();
  const noiseHintAvailable = useNoiseAnalysisAvailable();
  const { filteredRows, toggleTag, ...filters } = useSharedTestRunFilters();
  const [view, setView] = useState<TestRunView>("table");
  const [groupVariations, setGroupVariations] = useState(false);
  const { selectedIds, setSelectedIds, toggleAll, toggleGroup } =
    useTestRunSelection(selectedBuild?.id, groupVariations);
  const [gridSort, setGridSort] = useState<TestRunSort>(DEFAULT_SORT);

  const activeSort = useMemo(
    () => (view === "grid" ? gridSort : (sortOfModel(sortModel) ?? gridSort)),
    [view, gridSort, sortModel],
  );

  const groupByAxis = resolveGroupByAxis(selectedProject?.bulkApproveGroupBy);

  const groups = useMemo(
    () =>
      sortGroups(
        groupVariations
          ? groupTestRuns(filteredRows, groupByAxis)
          : singleRunGroups(filteredRows),
        activeSort,
      ),
    [groupVariations, filteredRows, groupByAxis, activeSort],
  );

  const sortedRows = useMemo(
    () => groups.flatMap((group) => group.runs),
    [groups],
  );

  const { name, statuses, tagFilters } = filters;
  const [pagedFilters, setPagedFilters] = useState({
    name,
    statuses,
    tagFilters,
  });
  if (
    pagedFilters.name !== name ||
    pagedFilters.statuses !== statuses ||
    pagedFilters.tagFilters !== tagFilters
  ) {
    setPagedFilters({ name, statuses, tagFilters });
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }

  useEffect(() => {
    const guard = staleGuard();

    testRunDispatch({
      type: "request",
    });
    if (selectedBuild?.id) {
      testRunService
        .getList(selectedBuild.id)
        .then((payload) => {
          if (guard.isCurrent()) {
            testRunDispatch({
              type: "get",
              payload,
            });
          }
        })
        .catch((err: string) => {
          if (guard.isCurrent()) {
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

    return guard.cancel;
  }, [testRunDispatch, enqueueSnackbar, selectedBuild?.id]);

  // the arrow order: the rows on screen with groups expanded, frozen while open
  const navigationIds = useMemo(
    () => sortedRows.map((run) => run.id),
    [sortedRows],
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

  const selectedBuildId = selectedBuild?.id;
  const openRun = useCallback(
    (id: string) => {
      if (selectedBuildId) {
        navigate(buildTestRunLocation(selectedBuildId, id));
      }
    },
    [navigate, selectedBuildId],
  );

  if (selectedBuild) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ paddingX: 2, paddingTop: 1, paddingBottom: 1 }}>
          <TestRunFilters
            {...filters}
            actions={
              <TestRunListControls
                view={view}
                onViewChange={setView}
                grouped={groupVariations}
                onGroupedChange={setGroupVariations}
                groupByAxis={groupByAxis}
              />
            }
          />
        </Box>
        <BulkOperation
          selectedIds={selectedIds}
          rows={view === "grid" ? sortedRows : filteredRows}
          onSelectAll={() => setSelectedIds(filteredRows.map((row) => row.id))}
          onClear={() => setSelectedIds([])}
          onProcessed={setSelectedIds}
        />
        <Box sx={{ flex: 1, minHeight: 0 }}>
          {view === "table" ? (
            <TestRunTable
              groups={groups}
              noiseAvailable={noiseHintAvailable}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              loading={loading}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              sortModel={sortModel}
              onSortModelChange={setSortModel}
              onOpen={openRun}
            />
          ) : (
            <TestRunCardView
              groups={groups}
              selectedIds={selectedIds}
              loading={loading}
              sort={gridSort}
              onSortChange={setGridSort}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              activeTags={tagFilters}
              noiseAvailable={noiseHintAvailable}
              onToggleAll={toggleAll}
              onToggleGroup={toggleGroup}
              onToggleTag={toggleTag}
              onOpen={openRun}
            />
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
