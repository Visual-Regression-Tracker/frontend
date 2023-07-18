import React, { FunctionComponent } from "react";
import { styled } from "@mui/material/styles";
import {
  List,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Typography,
  Grid,
  Pagination,
  LinearProgress,
  Menu,
  MenuItem,
  Box,
} from "@mui/material";
import { MoreVert } from "@mui/icons-material";
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

const PREFIX = "index";

const classes = {
  listContainer: `${PREFIX}-listContainer`,
  listItemSecondaryAction: `${PREFIX}-listItemSecondaryAction`,
  listItem: `${PREFIX}-listItem`,
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled("div")(() => ({
  [`& .${classes.listContainer}`]: {
    height: "100%",
    overflow: "auto",
  },

  [`& .${classes.listItemSecondaryAction}`]: {
    visibility: "hidden",
  },

  [`& .${classes.listItem}`]: {
    "&:hover $listItemSecondaryAction": {
      visibility: "inherit",
    },
  },
}));

const BuildList: FunctionComponent = () => {
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

  return (
    <Root>
      <Box height="91%" overflow="auto">
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
                  "data-testId": "newCiBuildId",
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
              .then(() => handlePaginationChange(paginationPage))
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
    </Root>
  );
};

export default React.memo(BuildList);
