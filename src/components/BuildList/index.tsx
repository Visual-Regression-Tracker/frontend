import React, { FunctionComponent } from "react";
import { makeStyles, createStyles } from "@mui/styles";
import {
  List,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Chip,
  Typography,
  Grid,
  Pagination,
  LinearProgress,
  Menu,
  MenuItem,
  Box,
} from "@mui/material";
import { MoreVert, DeleteOutline, Close } from "@mui/icons-material";
import {
  useBuildState,
  useBuildDispatch,
  deleteBuild,
  useProjectState,
} from "../../contexts";
import { BuildStatusChip } from "../BuildStatusChip";
import { SkeletonList } from "../SkeletonList";
import { formatDateTime } from "../../_helpers/format.helper";
import { useSnackbar } from "notistack";
import { TextValidator } from "react-material-ui-form-validator";
import { Build } from "../../types";
import { BaseModal } from "../BaseModal";
import { buildsService } from "../../services";
import { useNavigate } from "react-router";
import { buildTestRunLocation } from "../../_helpers/route.helpers";
import { Tooltip } from "../Tooltip";

const useStyles = makeStyles(() =>
  createStyles({
    listContainer: {
      height: "100%",
      overflow: "auto",
    },
    listItemSecondaryAction: {
      visibility: "hidden",
    },
    listItem: {
      paddingRight: 48,
      "&:hover $listItemSecondaryAction": {
        visibility: "inherit",
      },
    },
  }),
);

const BuildList: FunctionComponent = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { buildList, selectedBuild, loading, total, take } = useBuildState();
  const buildDispatch = useBuildDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedProjectId } = useProjectState();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuBuild, setMenuBuild] = React.useState<Build | null>();
  const [newCiBuildId, setNewCiBuildId] = React.useState("");
  const [paginationPage, setPaginationPage] = React.useState(1);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);

  const pageIds = buildList.map((build) => build.id);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const someOnPageSelected = selectedIds.length > 0 && !allOnPageSelected;

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleSelectAllOnPage = () =>
    setSelectedIds((prev) =>
      allOnPageSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : Array.from(new Set([...prev, ...pageIds])),
    );

  const clearSelection = () => setSelectedIds([]);

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    build: Build,
  ) => {
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

  const selectBuildCalback = React.useCallback(
    (id?: string) => navigate(buildTestRunLocation(id)),
    [navigate],
  );

  const handlePaginationChange = React.useCallback(
    (page: number) => {
      setPaginationPage(page);
      listRef.current?.scrollTo({ top: 0 });
      if (selectedProjectId) {
        buildDispatch({ type: "request" });
        buildsService
          .getList(selectedProjectId, take, take * (page - 1))
          .then((payload) => {
            buildDispatch({ type: "get", payload });
          })
          .catch((err: string) =>
            enqueueSnackbar(err, {
              variant: "error",
            }),
          );
      }
    },
    [buildDispatch, enqueueSnackbar, selectedProjectId, take],
  );

  React.useEffect(() => {
    handlePaginationChange(1);
  }, [handlePaginationChange]);

  React.useEffect(() => {
    setSelectedIds([]);
  }, [selectedProjectId]);

  const handleBulkDelete = () => {
    if (bulkDeleting) {
      return;
    }
    setBulkDeleting(true);
    setBulkDeleteDialogOpen(false);
    const ids = [...selectedIds];

    Promise.all(
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

      const remaining = total - deleted.length;
      const lastPage = Math.max(1, Math.ceil(remaining / take));
      handlePaginationChange(Math.min(paginationPage, lastPage));
    });
  };

  return (
    <>
      <Box height="91%" display="flex" flexDirection="column">
        {selectedIds.length > 0 && (
          <Box
            display="flex"
            alignItems="center"
            paddingX={1}
            paddingY={0.5}
            borderBottom={1}
            borderColor="divider"
          >
            <Checkbox
              size="small"
              checked={allOnPageSelected}
              indeterminate={someOnPageSelected}
              onChange={toggleSelectAllOnPage}
            />
            <Typography variant="body2">
              {selectedIds.length} selected
            </Typography>
            <Box marginLeft="auto">
              <Tooltip title="Delete selected">
                <IconButton
                  color="error"
                  size="small"
                  disabled={bulkDeleting}
                  onClick={() => setBulkDeleteDialogOpen(true)}
                >
                  <DeleteOutline />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear selection">
                <IconButton size="small" onClick={clearSelection}>
                  <Close />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
        <Box
          flex={1}
          overflow="auto"
          ref={listRef}
          data-testid="buildListScroll"
        >
          <List>
            {loading ? (
              <SkeletonList />
            ) : buildList.length === 0 ? (
              <Typography variant="h5">No builds</Typography>
            ) : (
              buildList.map((build) => (
                <React.Fragment key={build.id}>
                  <ListItemButton
                    selected={selectedBuild?.id === build.id}
                    onClick={() => selectBuildCalback(build.id)}
                    classes={{
                      root: classes.listItem,
                    }}
                  >
                    <Checkbox
                      edge="start"
                      size="small"
                      checked={selectedIds.includes(build.id)}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => toggleSelect(build.id)}
                    />
                    <ListItemText
                      disableTypography
                      primary={
                        <Typography
                          variant="subtitle2"
                          style={{
                            wordWrap: "break-word",
                          }}
                        >
                          {`#${build.number} ${build.ciBuildId || ""}`}
                        </Typography>
                      }
                      secondary={
                        <Grid container direction="column">
                          <Grid item>
                            <Typography variant="caption" color="textPrimary">
                              {formatDateTime(build.createdAt)}
                            </Typography>
                          </Grid>
                          {build.updatedAt && (
                            <Grid item>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                Last run: {formatDateTime(build.updatedAt)}
                              </Typography>
                            </Grid>
                          )}
                          <Grid item>
                            <Grid container justifyContent="space-between">
                              <Grid item>
                                <Tooltip title={build.branchName}>
                                  <Chip
                                    size="small"
                                    label={build.branchName}
                                    style={{ maxWidth: 180 }}
                                  />
                                </Tooltip>
                              </Grid>
                              <Grid item>
                                <BuildStatusChip status={build.status} />
                              </Grid>
                            </Grid>
                          </Grid>
                        </Grid>
                      }
                    />

                    <ListItemSecondaryAction
                      className={classes.listItemSecondaryAction}
                    >
                      <IconButton
                        onClick={(event) => handleMenuClick(event, build)}
                        size="large"
                      >
                        <MoreVert />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItemButton>
                  {build.isRunning && <LinearProgress />}
                </React.Fragment>
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
              onChange={(event, page) => handlePaginationChange(page)}
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
            <React.Fragment>
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
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                    setNewCiBuildId(event.target.value),
                  "data-testid": "newCiBuildId",
                }}
              />
            </React.Fragment>
          }
          onSubmit={() => {
            buildsService
              .update(menuBuild.id, {
                ciBuildId: newCiBuildId,
              })
              .then(() => {
                toggleEditDialogOpen();
              })
              .catch((err) =>
                enqueueSnackbar(err, {
                  variant: "error",
                }),
              );
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
                toggleDeleteDialogOpen();
                enqueueSnackbar(
                  `Build #${menuBuild.number || menuBuild.id} deleted`,
                  {
                    variant: "success",
                  },
                );
              })
              .then(() => {
                const lastPage = Math.max(1, Math.ceil((total - 1) / take));
                handlePaginationChange(Math.min(paginationPage, lastPage));
              })
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

export default React.memo(BuildList);
