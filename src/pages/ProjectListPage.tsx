import React, { useEffect } from "react";
import {
  Typography,
  Card,
  IconButton,
  CardContent,
  CardActions,
  Button,
  Box,
  Stack,
  Container,
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
import { Delete, Add, Edit, AccountTree } from "@mui/icons-material";
import { Tooltip } from "../components/Tooltip";
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" component="h1">
            Projects
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {projectState.projectList.length === 1
              ? "1 project"
              : `${projectState.projectList.length} projects`}
          </Typography>
        </Box>
        {canEditProjects && (
          <Button
            variant="contained"
            startIcon={<Add data-testid="AddIcon" />}
            onClick={() => {
              toggleCreateDialogOpen();
              setProjectEditState(projectDispatch);
            }}
          >
            Add project
          </Button>
        )}
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        }}
      >
        {projectState.projectList.map((project) => (
          <Card
            id={LOCATOR_PROJECT_LIST_PAGE_PROJECT_LIST}
            key={project.id}
            sx={{
              display: "flex",
              flexDirection: "column",
              "&:hover": { borderColor: "primary.main", boxShadow: 2 },
            }}
          >
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="h6" component="h2" noWrap>
                {project.name}
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.75}
                color="text.secondary"
                mt={0.5}
              >
                <AccountTree sx={{ fontSize: 16 }} />
                <Typography variant="body2" noWrap>
                  {project.mainBranchName}
                </Typography>
              </Stack>
              <Box
                component="dl"
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  columnGap: 2,
                  rowGap: 0.5,
                  m: 0,
                  mt: 2,
                  "& dt": { color: "text.secondary" },
                  "& dd": { m: 0, minWidth: 0, overflowWrap: "anywhere" },
                }}
              >
                <Typography component="dt" variant="caption">
                  Id
                </Typography>
                <Typography component="dd" variant="caption">
                  {project.id}
                </Typography>
                <Typography component="dt" variant="caption">
                  Created
                </Typography>
                <Typography component="dd" variant="caption">
                  {formatDateTime(project.createdAt)}
                </Typography>
              </Box>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button variant="contained" size="small" href={project.id}>
                Builds
              </Button>
              <Button
                variant="outlined"
                size="small"
                href={`${routes.VARIATION_LIST_PAGE}/${project.id}`}
              >
                Variations
              </Button>
              <Box flex={1} />
              {canEditProjects && (
                <>
                  <Tooltip title="Edit project">
                    <IconButton
                      onClick={() => {
                        toggleUpdateDialogOpen();
                        setProjectEditState(projectDispatch, project);
                      }}
                    >
                      <Edit data-testid="EditIcon" fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete project">
                    <IconButton
                      onClick={() => {
                        toggleDeleteDialogOpen();
                        setProjectEditState(projectDispatch, project);
                      }}
                      data-testid="delete"
                    >
                      <Delete data-testid="DeleteIcon" fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </CardActions>
          </Card>
        ))}
      </Box>

      {canEditProjects && (
        <>
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
        </>
      )}
    </Container>
  );
};

export default ProjectsListPage;
