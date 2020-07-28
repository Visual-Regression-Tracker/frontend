import React, { useEffect } from "react";
import {
  Grid,
  Typography,
  Card,
  IconButton,
  CardContent,
  CardActions,
  Fab,
  Button,
  Box,
} from "@material-ui/core";
import {
  useProjectState,
  useProjectDispatch,
  getProjectList,
  deleteProject,
  createProject,
  updateProject,
} from "../contexts";
import { Link } from "react-router-dom";
import { Delete, Add, Edit } from "@material-ui/icons";
import { routes } from "../constants";
import { formatDateTime } from "../_helpers/format.helper";
import { ProjectModal } from "../components/ProjectModal";
import { useSnackbar } from "notistack";

const ProjectsListPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const projectState = useProjectState();
  const projectDispatch = useProjectDispatch();

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false);
  const [project, setProject] = React.useState<{
    id: string;
    name: string;
    mainBranchName: string;
  }>({
    id: "",
    name: "",
    mainBranchName: "",
  });

  useEffect(() => {
    getProjectList(projectDispatch).catch((err) =>
      enqueueSnackbar(err, {
        variant: "error",
      })
    );
  }, [projectDispatch, enqueueSnackbar]);

  const toggleCreateDialogOpen = () => {
    setCreateDialogOpen(!createDialogOpen);
  };

  const toggleUpdateDialogOpen = () => {
    setUpdateDialogOpen(!updateDialogOpen);
  };

  return (
    <Box mt={2}>
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
              onClick={() => {
                toggleCreateDialogOpen();
                setProject({
                  id: "",
                  name: "",
                  mainBranchName: "",
                });
              }}
            >
              <Add />
            </Fab>
          </Box>

          <ProjectModal
            open={createDialogOpen}
            title={"Create Project"}
            submitButtonText={"Create"}
            onCancel={toggleCreateDialogOpen}
            projectState={[project, setProject]}
            onSubmit={() =>
              createProject(projectDispatch, project)
                .then((project) => {
                  toggleCreateDialogOpen();
                  enqueueSnackbar(`${project.name} created`, {
                    variant: "success",
                  });
                })
                .catch((err) =>
                  enqueueSnackbar(err, {
                    variant: "error",
                  })
                )
            }
          />

          <ProjectModal
            open={updateDialogOpen}
            title={"Update Project"}
            submitButtonText={"Update"}
            onCancel={toggleUpdateDialogOpen}
            projectState={[project, setProject]}
            onSubmit={() =>
              updateProject(projectDispatch, project)
                .then((project) => {
                  toggleUpdateDialogOpen();
                  enqueueSnackbar(`${project.name} updated`, {
                    variant: "success",
                  });
                })
                .catch((err) =>
                  enqueueSnackbar(err, {
                    variant: "error",
                  })
                )
            }
          />
        </Grid>
        {projectState.projectList.map((project) => (
          <Grid item xs={4} key={project.id}>
            <Card>
              <CardContent>
                <Typography>Id: {project.id}</Typography>
                <Typography>Name: {project.name}</Typography>
                <Typography>Main branch: {project.mainBranchName}</Typography>
                <Typography>
                  Created: {formatDateTime(project.createdAt)}
                </Typography>
              </CardContent>
              <CardActions>
                <Button color="primary" component={Link} to={`${project.id}`}>
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
                    toggleUpdateDialogOpen();
                    setProject(project);
                  }}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  onClick={(event: React.MouseEvent<HTMLElement>) => {
                    deleteProject(projectDispatch, project.id)
                      .then((project) => {
                        enqueueSnackbar(`${project.name} deleted`, {
                          variant: "success",
                        });
                      })
                      .catch((err) =>
                        enqueueSnackbar(err, {
                          variant: "error",
                        })
                      );
                  }}
                >
                  <Delete />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProjectsListPage;
