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
  stopBuild,
  getBuildList,
  useProjectState,
} from "../contexts";
import { BuildStatusChip } from "./BuildStatusChip";
import { SkeletonList } from "./SkeletonList";
import { formatDateTime } from "../_helpers/format.helper";
import { useSnackbar } from "notistack";
import { Build } from "../types";
import { BaseModal } from "./BaseModal";
import { Pagination } from "@material-ui/lab";

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
  const { selectedProjectId } = useProjectState();
  const { buildList, selectedBuildId, loading, total, take } = useBuildState();
  const buildDispatch = useBuildDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuBuild, setMenuBuild] = React.useState<Build | null>();

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

  React.useEffect(() => {
    if (!selectedBuildId && buildList.length > 0)
      selectBuild(buildDispatch, buildList[0].id);
  }, [buildDispatch, selectedBuildId, buildList]);

  return (
    <React.Fragment>
      {loading && <SkeletonList />}
      {buildList.length === 0 ? (
        <Typography variant="h5">No builds</Typography>
      ) : (
        <Box height={1}>
          <Box height="90%" overflow="auto">
            <List>
              {buildList.map((build) => (
                <React.Fragment key={build.id}>
                  <ListItem
                    selected={selectedBuildId === build.id}
                    button
                    onClick={() => {
                      selectBuild(buildDispatch, build.id);
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
              ))}
            </List>
          </Box>

          <Box height="10%">
            <Pagination
              defaultPage={1}
              count={Math.ceil(total / take)}
              onChange={(event, page) => getBuildListCalback(page)}
            />
          </Box>
        </Box>
      )}
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
          <MenuItem onClick={toggleDeleteDialogOpen}>Delete</MenuItem>
        </Menu>
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
              .then((b) => {
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
