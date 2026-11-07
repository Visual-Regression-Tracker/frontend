import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useHotkeys } from "react-hotkeys-hook";
import { EmptyState } from "../EmptyState";
import { ViewListOutlined } from "@mui/icons-material";
import { TestRunCardView } from "./TestRunCardView";
import {
  TestRunDensity,
  TestRunListControls,
  TestRunView,
} from "./TestRunListControls";
import { BulkOperation } from "./BulkOperation";
import { useShowDiff } from "./useShowDiff";
import { hotkeyMatching } from "../../_helpers/hotkeys.helper";
import { DEFAULT_SORT } from "./TestRunGridHeader";
import TestRunFilters from "./TestRunFilters";
import { TestRunTable } from "./TestRunTable";
import { useSharedTestRunFilters } from "./TestRunFiltersContext";
import { useTestRunSelection } from "./useTestRunSelection";
import { TagField } from "../../types";
import type { TestRunSort } from "../../types/testRunSort";
import { comparatorFor, sortOfModel } from "../../_helpers/testRunSort.helper";
import { testRunService } from "../../services";
import { useNavigate } from "react-router-dom";
import { buildTestRunLocation } from "../../_helpers/route.helpers";
import {
  groupTestRuns,
  resolveGroupByAxis,
  singleRunGroups,
} from "../../_helpers/testRunGroup.helper";
import { TAG_FIELDS } from "../../_helpers/testRunTags.helper";

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

  const [storedSortModel, setSortModel] =
    useState<GridSortModel>(DEFAULT_SORT_MODEL);

  const selectedProject = useSelectedProject();
  const noiseHintAvailable = useNoiseAnalysisAvailable();
  const { filteredRows, toggleTag, ...filters } = useSharedTestRunFilters();
  const { selectedIds, setSelectedIds, toggleAll, toggleGroup } =
    useTestRunSelection(selectedBuild?.id);
  const [view, setView] = useState<TestRunView>("table");
  const [density, setDensity] = useState<TestRunDensity>("standard");
  const [groupVariations, setGroupVariations] = useState(false);
  const [showDiff, setShowDiff] = useShowDiff();
  const [storedGridSort, setGridSort] = useState<TestRunSort>(DEFAULT_SORT);

  useHotkeys("d", () => setShowDiff((prev) => !prev), {
    ...hotkeyMatching,
    enabled: view === "grid" && !selectedTestRun,
  });

  const sortModel =
    !noiseHintAvailable && storedSortModel[0]?.field === "noise"
      ? DEFAULT_SORT_MODEL
      : storedSortModel;
  const gridSort =
    !noiseHintAvailable && storedGridSort.field === "noise"
      ? DEFAULT_SORT
      : storedGridSort;

  const activeSort = useMemo(
    () => (view === "grid" ? gridSort : (sortOfModel(sortModel) ?? gridSort)),
    [view, gridSort, sortModel],
  );

  const sortedRows = useMemo(
    () => [...filteredRows].sort(comparatorFor(activeSort, () => TAG_FIELDS)),
    [filteredRows, activeSort],
  );

  const groupByAxis = resolveGroupByAxis(selectedProject?.bulkApproveGroupBy);

  const sortedGroups = useMemo(
    () =>
      groupVariations
        ? groupTestRuns(sortedRows, groupByAxis)
        : singleRunGroups(sortedRows),
    [groupVariations, sortedRows, groupByAxis],
  );

  // the grouped axis varies within a group, so it tags only a group of one
  const tagFieldsFor = useCallback(
    (runCount: number): TagField[] =>
      groupVariations && runCount > 1
        ? TAG_FIELDS.filter((field) => field !== groupByAxis)
        : TAG_FIELDS,
    [groupVariations, groupByAxis],
  );

  // a group's place follows its representative, which is not its first run in the order
  const groups = useMemo(() => {
    if (!groupVariations || view === "grid") {
      return sortedGroups;
    }
    const runCounts = new Map(
      sortedGroups.map((group) => [group.representative.id, group.runs.length]),
    );
    const compare = comparatorFor(activeSort, (row) =>
      tagFieldsFor(runCounts.get(row.id) ?? 0),
    );
    return [...sortedGroups].sort((a, b) =>
      compare(a.representative, b.representative),
    );
  }, [groupVariations, view, sortedGroups, activeSort, tagFieldsFor]);

  const { name, statuses, tagFilters, noiseHints } = filters;
  const [pagedFilters, setPagedFilters] = useState({
    name,
    statuses,
    tagFilters,
    noiseHints,
  });
  if (
    pagedFilters.name !== name ||
    pagedFilters.statuses !== statuses ||
    pagedFilters.tagFilters !== tagFilters ||
    pagedFilters.noiseHints !== noiseHints
  ) {
    setPagedFilters({ name, statuses, tagFilters, noiseHints });
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }

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
    () => groups.flatMap((group) => group.runs.map((run) => run.id)),
    [groups],
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
                density={density}
                onDensityChange={setDensity}
                grouped={groupVariations}
                onGroupedChange={setGroupVariations}
                groupByAxis={groupByAxis}
                diffToggle={{ checked: showDiff, onChange: setShowDiff }}
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
              grouped={groupVariations}
              tagFieldsFor={tagFieldsFor}
              noiseAvailable={noiseHintAvailable}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              loading={loading}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              sortModel={sortModel}
              onSortModelChange={setSortModel}
              density={density}
              onOpen={openRun}
            />
          ) : (
            <TestRunCardView
              density={density}
              showDiff={showDiff}
              groups={groups}
              selectedIds={selectedIds}
              loading={loading}
              sort={gridSort}
              onSortChange={setGridSort}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              activeTags={tagFilters}
              tagFieldsFor={tagFieldsFor}
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
