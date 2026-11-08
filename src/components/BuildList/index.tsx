import {
  type MouseEvent,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  List,
  Checkbox,
  Typography,
  Pagination,
  Box,
  Stack,
} from "@mui/material";
import { DeleteOutlineOutlined } from "@mui/icons-material";
import { BuildListPlaceholder } from "./BuildListPlaceholder";
import { BuildListItem } from "./BuildListItem";
import { DebouncedTextField } from "../DebouncedTextField";
import {
  useBuildState,
  useBuildDispatch,
  deleteBuild,
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
import { Tooltip } from "../Tooltip";
import { TEST_ID } from "../../constants/locators";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);
  const selectAllRequest = useRef(0);
  // answers for a project or search the reviewer has left must not fill the list
  const pageRequest = useRef(0);

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

  const [seenRefresh, setSeenRefresh] = useState(refreshes);
  if (seenRefresh !== refreshes) {
    setSeenRefresh(refreshes);
    setSelectedIds((prev) => prev.filter((id) => id !== lastDeletedId));
  }

  const allSelected = total > 0 && selectedIds.length === total;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const clearSelection = () => setSelectedIds([]);

  const selectAllMatching = () => {
    if (buildList.length === total) {
      setSelectedIds(buildList.map((build) => build.id));
      return;
    }
    if (!selectedProjectId) {
      return;
    }

    const request = ++selectAllRequest.current;
    setSelectingAll(true);
    buildsService
      .getList(selectedProjectId, total, 0, searchQuery)
      .then((payload) => {
        if (request === selectAllRequest.current) {
          setSelectedIds(payload.data.map((build) => build.id));
        }
      })
      .catch((err: string) => enqueueSnackbar(err, { variant: "error" }))
      .finally(() => setSelectingAll(false));
  };

  const toggleSelectAll = () =>
    selectedIds.length > 0 ? clearSelection() : selectAllMatching();

  const selectAllLabel =
    selectedIds.length > 0 ? "Clear selection" : `Select all (${total})`;

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
      const request = ++pageRequest.current;
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
            if (request !== pageRequest.current) {
              return;
            }
            // the answer gives the build's page; an unplaced build stays on this one
            if (aroundBuildId && payload.take > 0) {
              setPaginationPage(Math.floor(payload.skip / payload.take) + 1);
            }
            buildDispatch({ type: "get", payload, search: searchQuery });
          })
          .catch((err: string) => {
            if (request !== pageRequest.current) {
              return;
            }
            buildDispatch({ type: "failure", payload: err });
            enqueueSnackbar(err, {
              variant: "error",
            });
          });
      }
    },
    [buildDispatch, enqueueSnackbar, selectedProjectId, take, searchQuery],
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

  // in the commit that cleared the selection, so an in-flight select all cannot land on another search
  useLayoutEffect(() => {
    selectAllRequest.current += 1;
  }, [selectedProjectId, searchQuery]);

  useEffect(() => {
    buildDispatch({ type: "reset" });
  }, [buildDispatch, selectedProjectId]);

  const handleBulkDelete = () => {
    if (bulkDeleting) {
      return;
    }
    setBulkDeleting(true);
    setBulkDeleteDialogOpen(false);
    const ids = [...selectedIds];

    void Promise.all(
      ids.map((id) =>
        deleteBuild(buildDispatch, id)
          .then(() => ({ id, ok: true }))
          .catch(() => ({ id, ok: false })),
      ),
    ).then((results) => {
      const deleted = results.filter((r) => r.ok);
      const failed = results.filter((r) => !r.ok);

      if (deleted.length > 0) {
        enqueueSnackbar(`${deleted.length} build(s) deleted`, {
          variant: "success",
        });
      }
      if (failed.length > 0) {
        enqueueSnackbar(`Failed to delete ${failed.length} build(s)`, {
          variant: "error",
        });
      }
      if (deleted.some((r) => r.id === selectedBuild?.id)) {
        selectBuildCalback();
      }

      setBulkDeleting(false);
      clearSelection();

      reloadAfterDeleting(deleted.length);
    });
  };

  const pageCount = Math.ceil(total / take);

  return (
    <>
      <Stack sx={{ height: "100%" }}>
        <Box sx={{ padding: 1, display: "flex", alignItems: "center" }}>
          {/* kept mounted so an empty search does not shift the search field */}
          <Tooltip title={selectAllLabel}>
            <span>
              <Checkbox
                size="small"
                checked={allSelected}
                indeterminate={someSelected}
                disabled={selectingAll || buildList.length === 0}
                onChange={toggleSelectAll}
                data-testid={TEST_ID.buildSelectAll}
                slotProps={{
                  input: { "aria-label": selectAllLabel },
                }}
              />
            </span>
          </Tooltip>
          <Box sx={{ flexGrow: 1 }}>
            <DebouncedTextField
              size="small"
              variant="outlined"
              fullWidth
              label="CI build id"
              placeholder="Search by CI build id"
              value={searchQuery}
              debounceTimeout={300}
              onChange={setSearchQuery}
              slotProps={{
                htmlInput: {
                  "data-testid": TEST_ID.buildSearch,
                  autoComplete: "off",
                },
              }}
            />
          </Box>
        </Box>
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
          data-testid={TEST_ID.buildListScroll}
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
        title={"Delete builds"}
        submitButtonText={"Delete"}
        submitColor="error"
        onCancel={() => setBulkDeleteDialogOpen(false)}
        content={
          <>
            <Typography>
              {`Are you sure you want to delete ${selectedIds.length} build(s)?`}
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
