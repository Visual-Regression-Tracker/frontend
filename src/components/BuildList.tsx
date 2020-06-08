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
} from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import { useHistory } from "react-router-dom";
import {
  useBuildState,
  useBuildDispatch,
  deleteBuild,
  selectBuild,
} from "../contexts";
import { BuildStatusChip } from "./BuildStatusChip";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
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
  const { buildList, selectedBuildId } = useBuildState();
  const buildDispatch = useBuildDispatch();

  return (
    <List>
      {buildList.map((build) => (
        <ListItem
          key={build.id}
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
              <Grid container>
                <Grid item>
                  <Typography variant="subtitle2">{`#${build.id}`}</Typography>
                </Grid>
              </Grid>
            }
            secondary={
              <Grid container direction="column">
                <Grid item>
                  <Typography variant="caption" color="textPrimary">
                    {build.createdAt}
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

          <ListItemSecondaryAction className={classes.listItemSecondaryAction}>
            <IconButton
              onClick={() => {
                deleteBuild(buildDispatch, build.id);
              }}
            >
              <Delete />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
};

export default BuildList;
