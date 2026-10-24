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
} from "@mui/material";
import {
  useProjectState,
  useProjectDispatch,
  deleteProject,
  createProject,
  updateProject,
  setProjectEditState,
  useHelpDispatch,
  setHelpSteps,
  useUserState,
} from "../contexts";
import { Delete, Add, Edit } from "@mui/icons-material";
import {
  routes,
  LOCATOR_PROJECT_LIST_PAGE_PROJECT_LIST,
  PROJECT_LIST_PAGE_STEPS,
} from "../constants";
import { formatDateTime } from "../_helpers/format.helper";
import { ProjectForm } from "../components/ProjectForm";
import { useSnackbar } from "notistack";
import { BaseModal } from "../components/BaseModal";
import { User } from "../types";

// the roles the API lets create, update and delete projects
const PROJECT_EDITOR_ROLES = new Set<User["role"]>(["admin", "editor"]);

const ProjectsListPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const projectState = useProjectState();
  const projectDispatch = useProjectDispatch();
  const helpDispatch = useHelpDispatch();
  const { user } = useUserState();
  const canEditProjects = !!user && PROJECT_EDITOR_ROLES.has(user.role);

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  useEffect(() => {
    setHelpSteps(helpDispatch, PROJECT_LIST_PAGE_STEPS);
  });

  const toggleCreateDialogOpen = () => {
    setCreateDialogOpen(!createDialogOpen);
  };

  const toggleUpdateDialogOpen = () => {
    setUpdateDialogOpen(!updateDialogOpen);
  };

  const toggleDeleteDialogOpen = () => {
    setDeleteDialogOpen(!deleteDialogOpen);
  };

  return (
    <Box mt={2}>
      <Grid container spacing={2}>
        {canEditProjects && (
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
                  setProjectEditState(projectDispatch);
                }}
              >
                <Add />
              </Fab>
            </Box>

            <BaseModal
              open={createDialogOpen}
              title={"Create Project"}
              submitButtonText={"Create"}
              onCancel={toggleCreateDialogOpen}
              content={<ProjectForm />}
              onSubmit={() =>
                createProject(projectDispatch, projectState.projectEditState)
                  .then((project) => {
                    toggleCreateDialogOpen();
                    enqueueSnackbar(`${project.name} created`, {
                      variant: "success",
                    });
                  })
                  .catch((err) =>
                    enqueueSnackbar(err, {
                      variant: "error",
                    }),
                  )
              }
            />

            <BaseModal
              open={updateDialogOpen}
              title={"Update Project"}
              submitButtonText={"Update"}
              onCancel={toggleUpdateDialogOpen}
              content={<ProjectForm />}
              onSubmit={() =>
                updateProject(projectDispatch, projectState.projectEditState)
                  .then((project) => {
                    toggleUpdateDialogOpen();
                    enqueueSnackbar(`${project.name} updated`, {
                      variant: "success",
                    });
                  })
                  .catch((err) =>
                    enqueueSnackbar(err, {
                      variant: "error",
                    }),
                  )
              }
            />

            <BaseModal
              open={deleteDialogOpen}
              title={"Delete Project"}
              submitButtonText={"Delete"}
              onCancel={toggleDeleteDialogOpen}
              content={
                <Typography>{`Are you sure you want to delete: ${projectState.projectEditState.name}?`}</Typography>
              }
              onSubmit={() =>
                deleteProject(projectDispatch, projectState.projectEditState.id)
                  .then((project) => {
                    toggleDeleteDialogOpen();
                    enqueueSnackbar(`${project.name} deleted`, {
                      variant: "success",
                    });
                  })
                  .catch((err) =>
                    enqueueSnackbar(err, {
                      variant: "error",
                    }),
                  )
              }
            />
          </Grid>
        )}
        {projectState.projectList.map((project) => (
          <Grid item xs={4} key={project.id}>
            <Card id={LOCATOR_PROJECT_LIST_PAGE_PROJECT_LIST}>
              <CardContent>
                <Typography>Id: {project.id}</Typography>
                <Typography>Name: {project.name}</Typography>
                <Typography>Main branch: {project.mainBranchName}</Typography>
                <Typography>
                  Created: {formatDateTime(project.createdAt)}
                </Typography>
              </CardContent>
              <CardActions>
                <Button color="primary" href={project.id}>
                  Builds
                </Button>
                <Button
                  color="primary"
                  href={`${routes.VARIATION_LIST_PAGE}/${project.id}`}
                >
                  Variations
                </Button>
                {canEditProjects && (
                  <>
                    <IconButton
                      onClick={() => {
                        toggleUpdateDialogOpen();
                        setProjectEditState(projectDispatch, project);
                      }}
                      size="large"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        toggleDeleteDialogOpen();
                        setProjectEditState(projectDispatch, project);
                      }}
                      size="large"
                      data-testid="delete"
                    >
                      <Delete />
                    </IconButton>
                  </>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProjectsListPage;
