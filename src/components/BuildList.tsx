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
} from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import { Build } from "../types";
import { buildsService } from "../services";

interface IBuildList {
  builds: Build[];
  setBuilds: React.Dispatch<React.SetStateAction<Build[]>>;
  selectedBuildId: string | undefined;
  setSelectedBuildId: React.Dispatch<React.SetStateAction<string | undefined>>;
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
  setSelectedBuildId,
}) => {
  const classes = useStyles();
  return (
    <List>
      {builds.map((build) => (
        <ListItem
          key={build.id}
          selected={selectedBuildId === build.id}
          button
          onClick={() => setSelectedBuildId(build.id)}
          classes={{
            container: classes.listItem,
          }}
        >
          <ListItemText
            primary={`#${build.id}`}
            secondary={`Date: ${build.createdAt}`}
          />
          <Typography>Branch: {build.branchName}</Typography>
          <ListItemSecondaryAction className={classes.listItemSecondaryAction}>
            <IconButton aria-label="Comments">
              <Delete
                onClick={() => {
                  buildsService.remove(build.id).then(isRemoved => {
                      if(isRemoved) {
                        setBuilds(builds.filter(item => item.id !== build.id))
                      }
                  });
                }}
              />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
};

export default BuildList;
