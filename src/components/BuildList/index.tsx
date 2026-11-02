import {
  type ChangeEvent,
  Fragment,
  type MouseEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  List,
  IconButton,
  Checkbox,
  Typography,
  GridLegacy as Grid,
  Pagination,
  Menu,
  MenuItem,
  Box,
  Fade,
} from "@mui/material";
import { DeleteOutline } from "@mui/icons-material";
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
import { TextValidator } from "react-material-ui-form-validator";
import { Build } from "../../types";
import { BaseModal } from "../BaseModal";
import { buildsService } from "../../services";
import { useLocation, useNavigate } from "react-router-dom";
import {
  buildTestRunLocation,
  getQueryParams,
} from "../../_helpers/route.helpers";
import { Tooltip } from "../Tooltip";

const BuildList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { buildList, selectedBuild, loading, error, total, take } =
    useBuildState();
  const buildDispatch = useBuildDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedProjectId } = useProjectState();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuBuild, setMenuBuild] = useState<Build | null>();
  const [newCiBuildId, setNewCiBuildId] = useState("");
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
    setAnchorEl(event.currentTarget);
    setMenuBuild(build);
  };

  const handleMenuClose = () => {
    setMenuBuild(null);
  };

  const toggleDeleteDialogOpen = () => {
    setDeleteDialogOpen(!deleteDialogOpen);
  };

  const toggleEditDialogOpen = () => {
    setEditDialogOpen(!editDialogOpen);
  };

  const selectBuildCalback = useCallback(
    (id?: string) => {
      navigate(buildTestRunLocation(id));
    },
    [navigate],
  );

  const loadPage = useCallback(
    (page: number, aroundBuildId?: string) => {
      setPaginationPage(page);
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

  const reloadAfterDeleting = (count: number) =>
    loadPage(
      Math.min(paginationPage, Math.max(1, Math.ceil((total - count) / take))),
    );

  // A link names a build, not its page, so the list must ask for the page holding it.
  useEffect(() => {
    loadPage(1, linkedBuildId.current);
  }, [loadPage]);

  useEffect(() => {
    // drops an in-flight select all so its ids cannot land on another search
    selectAllRequest.current += 1;
    setSelectedIds([]);
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

  return (
    <>
      <Box height="91%" display="flex" flexDirection="column">
        <Box padding={1} display="flex" alignItems="center">
          {/* kept mounted so an empty search does not shift the search field */}
          <Tooltip title={selectAllLabel}>
            <span>
              <Checkbox
                size="small"
                checked={allSelected}
                indeterminate={someSelected}
                disabled={selectingAll || buildList.length === 0}
                onChange={toggleSelectAll}
                inputProps={{ "aria-label": selectAllLabel }}
                data-testid="buildSelectAll"
              />
            </span>
          </Tooltip>
          <Box flexGrow={1}>
            <DebouncedTextField
              size="small"
              variant="outlined"
              fullWidth
              label="Search build"
              placeholder="Search by CI build id"
              value={searchQuery}
              debounceTimeout={300}
              onChange={setSearchQuery}
              inputProps={{ "data-testid": "buildSearch", autoComplete: "off" }}
            />
          </Box>
          {/* fades in place so picking a build does not resize the search field */}
          <Fade in={selectedIds.length > 0}>
            <span>
              <Tooltip title={`Delete ${selectedIds.length} selected`}>
                <IconButton
                  color="error"
                  disabled={bulkDeleting}
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  data-testid="buildDeleteSelected"
                >
                  <DeleteOutline />
                </IconButton>
              </Tooltip>
            </span>
          </Fade>
        </Box>
        <Box
          flex={1}
          overflow="auto"
          ref={listRef}
          data-testid="buildListScroll"
        >
          <List>
            {buildList.length === 0 ? (
              <BuildListPlaceholder
                loading={loading}
                error={error}
                searchQuery={searchQuery}
              />
            ) : (
              buildList.map((build) => (
                <BuildListItem
                  key={build.id}
                  build={build}
                  selected={selectedBuild?.id === build.id}
                  checked={selectedIds.includes(build.id)}
                  onOpen={() => selectBuildCalback(build.id)}
                  onToggleChecked={() => toggleSelect(build.id)}
                  onMenuClick={(event) => handleMenuClick(event, build)}
                />
              ))
            )}
          </List>
        </Box>
      </Box>
      <Box height="9%">
        <Grid container justifyContent="center">
          <Grid item>
            <Pagination
              size="small"
              defaultPage={1}
              page={paginationPage}
              count={Math.ceil(total / take)}
              onChange={(_event, page) => loadPage(page)}
            />
          </Grid>
        </Grid>
      </Box>

      {menuBuild && (
        <Menu anchorEl={anchorEl} open={!!menuBuild} onClose={handleMenuClose}>
          {menuBuild.isRunning && (
            <MenuItem
              onClick={() => {
                buildsService
                  .update(menuBuild.id, { isRunning: false })
                  .then(() =>
                    enqueueSnackbar(`${menuBuild.id} finished`, {
                      variant: "success",
                    }),
                  )
                  .catch((err) =>
                    enqueueSnackbar(err, {
                      variant: "error",
                    }),
                  );
                handleMenuClose();
              }}
            >
              Stop
            </MenuItem>
          )}
          <MenuItem onClick={toggleEditDialogOpen}>Edit CI Build</MenuItem>
          <MenuItem onClick={toggleDeleteDialogOpen}>Delete</MenuItem>
        </Menu>
      )}
      {menuBuild && (
        <BaseModal
          open={editDialogOpen}
          title={"Edit CI Build ID"}
          submitButtonText={"Edit"}
          onCancel={toggleEditDialogOpen}
          content={
            <Fragment>
              <Typography>{`Edit the ci build id for build: #${
                menuBuild.number || menuBuild.id
              }`}</Typography>
              <TextValidator
                name="newCiBuildId"
                validators={["minStringLength:2"]}
                errorMessages={["Enter at least two characters."]}
                margin="dense"
                id="name"
                label="New CI Build Id"
                type="text"
                fullWidth
                required
                value={newCiBuildId}
                inputProps={{
                  onChange: (event: ChangeEvent<HTMLInputElement>) =>
                    setNewCiBuildId(event.target.value),
                  "data-testid": "newCiBuildId",
                }}
              />
            </Fragment>
          }
          onSubmit={() => {
            buildsService
              .update(menuBuild.id, {
                ciBuildId: newCiBuildId,
              })
              .catch((err) =>
                enqueueSnackbar(err, {
                  variant: "error",
                }),
              );
            // closed now, even on failure: left open, it would reopen with this build's input
            setEditDialogOpen(false);
            setNewCiBuildId("");
            handleMenuClose();
          }}
        />
      )}
      {menuBuild && (
        <BaseModal
          open={deleteDialogOpen}
          title={"Delete Build"}
          submitButtonText={"Delete"}
          onCancel={toggleDeleteDialogOpen}
          content={
            <Typography>{`Are you sure you want to delete build: #${
              menuBuild.number || menuBuild.id
            }?`}</Typography>
          }
          onSubmit={() => {
            deleteBuild(buildDispatch, menuBuild.id)
              .then(() => {
                setSelectedIds((prev) =>
                  prev.filter((id) => id !== menuBuild.id),
                );
                enqueueSnackbar(
                  `Build #${menuBuild.number || menuBuild.id} deleted`,
                  {
                    variant: "success",
                  },
                );
              })
              .then(() => reloadAfterDeleting(1))
              .then(() => {
                if (menuBuild.id === selectedBuild?.id) {
                  selectBuildCalback();
                }
              })
              .catch((err) =>
                enqueueSnackbar(err, {
                  variant: "error",
                }),
              );
            setDeleteDialogOpen(false);
            handleMenuClose();
          }}
        />
      )}
      <BaseModal
        open={bulkDeleteDialogOpen}
        title={"Delete Builds"}
        submitButtonText={"Delete"}
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
