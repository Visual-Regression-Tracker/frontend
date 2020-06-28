import React, { useEffect } from "react";
import {
  Grid,
  Typography,
  Card,
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
  Container,
  Box,
  useTheme,
} from "@material-ui/core";
import {
  useProjectState,
  useProjectDispatch,
  getProjectList,
  deleteProject,
  createProject,
} from "../contexts";
import { Link } from "react-router-dom";
import { Delete, Add } from "@material-ui/icons";
import { routes } from "../constants";
import { formatDateTime } from "../_helpers/format.helper";

const ProjectsListPage = () => {
  const theme = useTheme();
  const projectState = useProjectState();
  const projectDispatch = useProjectDispatch();

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState<string>("");

  useEffect(() => {
    getProjectList(projectDispatch);
  }, [projectDispatch]);

  const handleCreateClickOpen = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateClose = () => {
    setCreateDialogOpen(false);
  };

  return (
    <Container
      style={{
        marginTop: theme.spacing(4),
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Box
            height="100%"
            alignItems="center"
            justifyContent="center"
            display="flex"
          >
            <Fab
              color="primary"
              aria-label="add"
              onClick={handleCreateClickOpen}
            >
              <Add />
            </Fab>
          </Box>

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
                  createProject(projectDispatch, {
                    name: newProjectName,
                  }).then((project) => {
                    setNewProjectName("");
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
        {projectState.projectList.map((project) => (
          <Grid item xs={4} key={project.id}>
            <Card>
              <CardContent>
                <Typography>Key: {project.id}</Typography>
                <Typography>Name: {project.name}</Typography>
                <Typography>Created: {formatDateTime(project.createdAt)}</Typography>
              </CardContent>
              <CardActions>
                <Button
                  color="primary"
                  component={Link}
                  to={`${project.id}`}
                >
                  Builds
                </Button>
                <Button
                  color="primary"
                  component={Link}
                  to={`${routes.VARIATION_LIST_PAGE}/${project.id}`}
                >
                  Variations
                </Button>
                <IconButton
                  onClick={(event: React.MouseEvent<HTMLElement>) => {
                    deleteProject(projectDispatch, project.id);
                  }}
                  style={{
                    marginLeft: "auto",
                  }}
                >
                  <Delete />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ProjectsListPage;
