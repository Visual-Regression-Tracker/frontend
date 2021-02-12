import React, { FunctionComponent } from "react";
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  makeStyles,
  Theme,
  createStyles,
  Chip,
  Typography,
  Grid,
  LinearProgress,
  Menu,
  MenuItem,
  Box,
} from "@material-ui/core";
import { MoreVert } from "@material-ui/icons";
import { useHistory } from "react-router-dom";
import {
  useBuildState,
  useBuildDispatch,
  deleteBuild,
  selectBuild,
  modifyBuild,
  stopBuild,
  getBuildList,
  useProjectState,
} from "../../contexts";
import { BuildStatusChip } from "../BuildStatusChip";
import { SkeletonList } from "../SkeletonList";
import { formatDateTime } from "../../_helpers/format.helper";
import { useSnackbar } from "notistack";
import { TextValidator } from "react-material-ui-form-validator";
import { Pagination } from "@material-ui/lab";
import { Build } from "../../types";
import { BaseModal } from "../BaseModal";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    listContainer: {
      height: "100%",
      overflow: "auto",
    },
    listItemSecondaryAction: {
      visibility: "hidden",
    },
    listItem: {
      "&:hover $listItemSecondaryAction": {
        visibility: "inherit",
      },
    },
  })
);

const BuildList: FunctionComponent = () => {
  const classes = useStyles();
  const history = useHistory();
  const { buildList, selectedBuild, loading, total, take } = useBuildState();
  const buildDispatch = useBuildDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedProjectId } = useProjectState();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuBuild, setMenuBuild] = React.useState<Build | null>();
  const [newCiBuildId, setNewCiBuildId] = React.useState("");

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    build: Build
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

  React.useEffect(() => {
    if (!selectedBuild && buildList.length > 0) {
      selectBuild(buildDispatch, buildList[0].id);
    }
  }, [buildDispatch, selectedBuild, buildList]);

  const getBuildListCalback: any = React.useCallback(
    (page: number) =>
      selectedProjectId &&
      getBuildList(buildDispatch, selectedProjectId, page).catch(
        (err: string) =>
          enqueueSnackbar(err, {
            variant: "error",
          })
      ),
    [buildDispatch, enqueueSnackbar, selectedProjectId]
  );

  React.useEffect(() => {
    getBuildListCalback(1);
  }, [getBuildListCalback]);

  return (
    <React.Fragment>
      <Box height="91%" overflow="auto">
        <List>
          {loading ? (
            <SkeletonList />
          ) : buildList.length === 0 ? (
            <Typography variant="h5">No builds</Typography>
          ) : (
            buildList.map((build) => (
              <React.Fragment key={build.id}>
                <ListItem
                  selected={selectedBuild?.id === build.id}
                  button
                  onClick={() => {
                    history.push({
                      search: "buildId=" + build.id,
                    });
                  }}
                  classes={{
                    container: classes.listItem,
                  }}
                >
                  <ListItemText
                    disableTypography
                    primary={
                      <Typography variant="subtitle2">{`#${build.number} ${
                        build.ciBuildId || ""
                      }`}</Typography>
                    }
                    secondary={
                      <Grid container direction="column">
                        <Grid item>
                          <Typography variant="caption" color="textPrimary">
                            {formatDateTime(build.createdAt)}
                          </Typography>
                        </Grid>
                        <Grid item>
                          <Grid container justify="space-between">
                            <Grid item>
                              <Chip size="small" label={build.branchName} />
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
                    >
                      <MoreVert />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {build.isRunning && <LinearProgress />}
              </React.Fragment>
            ))
          )}
        </List>
      </Box>
      <Box height="9%">
        <Grid container justify="center">
          <Grid item>
            <Pagination
              size="small"
              defaultPage={1}
              count={Math.ceil(total / take)}
              onChange={(event, page) => getBuildListCalback(page)}
            />
          </Grid>
        </Grid>
      </Box>

      {menuBuild && (
        <Menu anchorEl={anchorEl} open={!!menuBuild} onClose={handleMenuClose}>
          {menuBuild.isRunning && (
            <MenuItem
              onClick={() => {
                stopBuild(buildDispatch, menuBuild.id)
                  .then((b) =>
                    enqueueSnackbar(`${menuBuild.id} finished`, {
                      variant: "success",
                    })
                  )
                  .catch((err) =>
                    enqueueSnackbar(err, {
                      variant: "error",
                    })
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
                  onChange: (event: any) =>
                    setNewCiBuildId((event.target as HTMLInputElement).value),
                  "data-testid": "newCiBuildId",
                }}
              />
            </React.Fragment>
          }
          onSubmit={() => {
            modifyBuild(buildDispatch, menuBuild.id, {
              ciBuildId: newCiBuildId,
            })
              .then((b) => {
                toggleEditDialogOpen();
              })
              .catch((err) =>
                enqueueSnackbar(err, {
                  variant: "error",
                })
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
            let indexOfBuildDeleted = buildList.findIndex(
              (e) => e.id === menuBuild.id
            );
            let indexOfSelectedBuild = buildList.findIndex(
              (e) => e.id === selectedBuild?.id
            );
            deleteBuild(buildDispatch, menuBuild.id)
              .then((b) => {
                if (indexOfBuildDeleted === indexOfSelectedBuild) {
                  if (buildList.length > 1) {
                    if (indexOfBuildDeleted === 0) {
                      selectBuild(buildDispatch, buildList[1].id);
                    } else {
                      selectBuild(
                        buildDispatch,
                        buildList[indexOfBuildDeleted - 1].id
                      );
                    }
                  } else {
                    selectBuild(buildDispatch, null);
                  }
                }
                toggleDeleteDialogOpen();
                enqueueSnackbar(
                  `Build #${menuBuild.number || menuBuild.id} deleted`,
                  {
                    variant: "success",
                  }
                );
              })
              .catch((err) =>
                enqueueSnackbar(err, {
                  variant: "error",
                })
              );
            handleMenuClose();
          }}
        />
      )}
    </React.Fragment>
  );
};

export default BuildList;
