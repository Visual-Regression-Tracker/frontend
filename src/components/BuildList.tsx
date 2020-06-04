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
} from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import { useHistory } from "react-router-dom";
import {
  useBuildState,
  useBuildDispatch,
  deleteBuild,
} from "../contexts/build.context";

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
            history.push({
              search: "buildId=" + build.id,
            });
          }}
          classes={{
            container: classes.listItem,
          }}
        >
          <ListItemText
            primary={`#${build.id}`}
            secondary={`Date: ${build.createdAt}`}
          />
          <Chip size="small" label={build.branchName} />
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
