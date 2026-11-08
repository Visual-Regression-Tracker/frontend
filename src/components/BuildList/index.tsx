import {
  type MouseEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { List, Typography, Pagination, Box, Stack } from "@mui/material";
import { DeleteOutlineOutlined } from "@mui/icons-material";
import { BuildListPlaceholder } from "./BuildListPlaceholder";
import { BuildListItem } from "./BuildListItem";
import { BuildListToolbar } from "./BuildListToolbar";
import { useBulkDeleteBuilds } from "./useBulkDeleteBuilds";
import { useBuildSelection } from "./useBuildSelection";
import { useRequestGuard } from "../../_helpers/staleGuard";
import { pluralize } from "../../_helpers/format.helper";
import {
  useBuildState,
  useBuildDispatch,
  useProjectState,
} from "../../contexts";
import { useSnackbar } from "notistack";
import { BuildMenu } from "../BuildMenu";
import { SelectionBar } from "../SelectionBar";
import { Build } from "../../types";
import { BaseModal } from "../BaseModal";
import { buildsService } from "../../services";
import { useLocation, useNavigate } from "react-router-dom";
import {
  buildTestRunLocation,
  getQueryParams,
} from "../../_helpers/route.helpers";

const BuildList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    buildList,
    selectedBuild,
    loading,
    error,
    total,
    take,
    refreshes,
    lastDeletedId,
  } = useBuildState();
  const buildDispatch = useBuildDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedProjectId } = useProjectState();
  const [menu, setMenu] = useState<{
    build: Build;
    anchorEl: HTMLElement;
  } | null>(null);
  const [paginationPage, setPaginationPage] = useState(1);
  // the opened build, read once: picking a build later must not move the list
  const linkedBuildId = useRef(getQueryParams(location.search).buildId);
  const [searchQuery, setSearchQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const {
    selectedIds,
    setSelectedIds,
    selectingAll,
    allSelected,
    someSelected,
    toggleSelect,
    clearSelection,
    selectAllMatching,
    toggleSelectAll,
    selectAllLabel,
  } = useBuildSelection({
    buildList,
    total,
    selectedProjectId,
    searchQuery,
    refreshes,
    lastDeletedId,
  });
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const pageGuard = useRequestGuard();

  // a new project or search starts on the first page, with nothing selected
  const [listedFor, setListedFor] = useState({
    selectedProjectId,
    searchQuery,
    take,
  });
  const listChanged =
    listedFor.selectedProjectId !== selectedProjectId ||
    listedFor.searchQuery !== searchQuery;
  if (listChanged || listedFor.take !== take) {
    if (listChanged) {
      setSelectedIds([]);
    }
    setPaginationPage(1);
    setListedFor({ selectedProjectId, searchQuery, take });
  }

  const handleMenuClick = (event: MouseEvent<HTMLElement>, build: Build) => {
    event.stopPropagation();
    setMenu({ build, anchorEl: event.currentTarget });
  };

  const handleDeleted = (build: Build) => {
    setSelectedIds((prev) => prev.filter((id) => id !== build.id));
    reloadAfterDeleting(1);
    if (build.id === selectedBuild?.id) {
      selectBuildCalback();
    }
  };

  const selectBuildCalback = useCallback(
    (id?: string) => {
      navigate(buildTestRunLocation(id));
    },
    [navigate],
  );

  const loadPage = useCallback(
    (page: number, aroundBuildId?: string) => {
      listRef.current?.scrollTo({ top: 0 });
      const isCurrent = pageGuard.start();
      if (selectedProjectId) {
        // the link is spent: from here paging and search decide the page
        linkedBuildId.current = undefined;
        buildDispatch({ type: "request" });
        buildsService
          .getList(
            selectedProjectId,
            take,
            take * (page - 1),
            searchQuery,
            aroundBuildId,
          )
          .then((payload) => {
            if (!isCurrent()) {
              return;
            }
            // the answer gives the build's page; an unplaced build stays on this one
            if (aroundBuildId && payload.take > 0) {
              setPaginationPage(Math.floor(payload.skip / payload.take) + 1);
            }
            buildDispatch({ type: "get", payload, search: searchQuery });
          })
          .catch((err: string) => {
            if (!isCurrent()) {
              return;
            }
            buildDispatch({ type: "failure", payload: err });
            enqueueSnackbar(err, {
              variant: "error",
            });
          });
      }
    },
    [
      buildDispatch,
      enqueueSnackbar,
      pageGuard,
      selectedProjectId,
      take,
      searchQuery,
    ],
  );

  const showPage = (page: number) => {
    setPaginationPage(page);
    loadPage(page);
  };

  const reloadAfterDeleting = (count: number) =>
    showPage(
      Math.min(paginationPage, Math.max(1, Math.ceil((total - count) / take))),
    );

  // A link names a build, not its page, so the list must ask for the page holding it.
  useEffect(() => {
    loadPage(1, linkedBuildId.current);
  }, [loadPage]);

  const seenRefreshes = useRef(refreshes);
  useEffect(() => {
    if (seenRefreshes.current !== refreshes) {
      seenRefreshes.current = refreshes;
      reloadAfterDeleting(0);
    }
  });

  useEffect(() => {
    buildDispatch({ type: "reset" });
  }, [buildDispatch, selectedProjectId]);

  const { bulkDeleting, handleBulkDelete } = useBulkDeleteBuilds({
    selectedIds,
    selectedBuildId: selectedBuild?.id,
    clearSelection,
    closeDialog: () => setBulkDeleteDialogOpen(false),
    onDone: (deleted) => reloadAfterDeleting(deleted),
    openAfterDelete: () => selectBuildCalback(),
  });

  const pageCount = Math.ceil(total / take);

  return (
    <>
      <Stack sx={{ height: "100%" }}>
        <BuildListToolbar
          selectAllLabel={selectAllLabel}
          allSelected={allSelected}
          someSelected={someSelected}
          selectAllDisabled={selectingAll || buildList.length === 0}
          onToggleSelectAll={toggleSelectAll}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        {selectedIds.length > 0 && (
          <Box sx={{ px: 1, pb: 1 }}>
            <SelectionBar
              selected={selectedIds.length}
              total={total}
              actions={[
                {
                  label: "Delete…",
                  icon: <DeleteOutlineOutlined />,
                  color: "error",
                  disabled: bulkDeleting,
                  onClick: () => setBulkDeleteDialogOpen(true),
                },
              ]}
              onSelectAll={selectAllMatching}
              onClose={clearSelection}
            />
          </Box>
        )}
        <Box
          ref={listRef}
          data-testid="buildListScroll"
          sx={{ flex: 1, minHeight: 0, overflow: "auto" }}
        >
          <List disablePadding>
            {buildList.length === 0 ? (
              <BuildListPlaceholder
                loading={loading}
                error={error}
                searchQuery={searchQuery}
                onRetry={() => loadPage(paginationPage)}
              />
            ) : (
              buildList.map((build) => (
                <BuildListItem
                  key={build.id}
                  build={build}
                  selected={selectedBuild?.id === build.id}
                  checked={selectedIds.includes(build.id)}
                  selecting={selectedIds.length > 0}
                  onOpen={() => selectBuildCalback(build.id)}
                  onToggleChecked={() => toggleSelect(build.id)}
                  onMenuClick={(event) => handleMenuClick(event, build)}
                />
              ))
            )}
          </List>
        </Box>
        {pageCount > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
            <Pagination
              size="small"
              page={paginationPage}
              count={pageCount}
              onChange={(_event, page) => showPage(page)}
            />
          </Box>
        )}
      </Stack>

      {menu && (
        <BuildMenu
          build={menu.build}
          anchorEl={menu.anchorEl}
          onClose={() => setMenu(null)}
          onDeleted={handleDeleted}
        />
      )}
      <BaseModal
        open={bulkDeleteDialogOpen}
        title={pluralize(selectedIds.length, "Delete build", "Delete builds")}
        submitButtonText={"Delete"}
        submitColor="error"
        onCancel={() => setBulkDeleteDialogOpen(false)}
        content={
          <>
            <Typography>
              {`Delete ${selectedIds.length} ${pluralize(selectedIds.length, "build")}?`}
            </Typography>
            <Typography>This also removes their test runs.</Typography>
          </>
        }
        onSubmit={handleBulkDelete}
      />
    </>
  );
};

export default memo(BuildList);
