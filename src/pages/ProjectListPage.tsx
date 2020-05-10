import React, { useEffect, useState } from "react";
import {
  Grid,
  Typography,
  Card,
  CardActionArea,
  IconButton,
  CardContent,
  CardActions,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from "@material-ui/core";
import { projectsService } from "../services/projects.service";
import { Project } from "../types";
import { Link } from "react-router-dom";
import { routes } from "../constants";
import { Delete, Add } from "@material-ui/icons";

const ProjectsListPage = () => {
  const [projectList, setProjectList] = useState([] as Project[]);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState<string>("");

  useEffect(() => {
    projectsService.getAll().then((projects) => setProjectList(projects));
  }, []);

  const handleCreateClickOpen = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateClose = () => {
    setCreateDialogOpen(false);
  };

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <Fab color="primary" aria-label="add" onClick={handleCreateClickOpen}>
          <Add />
        </Fab>
        <Dialog
          open={createDialogOpen}
          onClose={handleCreateClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Create Project</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Project name"
              type="text"
              fullWidth
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCreateClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                projectsService
                  .create({
                    name: newProjectName,
                  })
                  .then((project) => {
                    setProjectList([project, ...projectList]);
                    handleCreateClose();
                  });
              }}
              color="primary"
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
      {projectList.map((project) => (
        <Grid item key={project.id}>
          <Card>
            <CardContent>
              <Typography>Key: {project.id}</Typography>
            </CardContent>
            <CardActionArea
              component={Link}
              to={`${routes.PROJECT}/${project.id}`}
            >
              <CardContent>
                <Typography>Name: {project.name}</Typography>
                <Typography>Updated: {project.updatedAt}</Typography>
              </CardContent>
            </CardActionArea>
            <CardActions>
              <IconButton
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                  projectsService.remove(project.id).then((isDeleted) => {
                    if (isDeleted) {
                      setProjectList(
                        projectList.filter((p) => p.id !== project.id)
                      );
                    }
                  });
                }}
              >
                <Delete />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default ProjectsListPage;
