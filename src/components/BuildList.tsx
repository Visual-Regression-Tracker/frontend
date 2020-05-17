import React, { FunctionComponent } from "react";
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  ListItemSecondaryAction,
  IconButton,
  makeStyles,
  Theme,
  createStyles,
  Chip,
} from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import { Build } from "../types";
import { buildsService } from "../services";
import { useHistory } from "react-router-dom";

interface IBuildList {
  builds: Build[];
  setBuilds: React.Dispatch<React.SetStateAction<Build[]>>;
  selectedBuildId: string | undefined;
}

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

const BuildList: FunctionComponent<IBuildList> = ({
  builds,
  setBuilds,
  selectedBuildId,
}) => {
  const classes = useStyles();
  const history = useHistory();

  return (
    <List>
      {builds.map((build) => (
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
                buildsService.remove(build.id).then((isRemoved) => {
                  if (isRemoved) {
                    setBuilds(builds.filter((item) => item.id !== build.id));
                  }
                });
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
