import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Typography, Button, Box, Stack, Container } from "@mui/material";
import {
  useProjectState,
  useProjectDispatch,
  deleteProject,
  createProject,
  updateProject,
  setProjectEditState,
  toggleFavoriteProject,
  useHelpSteps,
  useUserState,
} from "../contexts";
import { Add, FolderOpenOutlined, Search } from "@mui/icons-material";
import { EmptyState } from "../components/EmptyState";
import { SkeletonList } from "../components/SkeletonList";
import { ProjectCard } from "../components/ProjectCard";
import { ProjectGrid, ProjectSection } from "../components/ProjectGrid";
import { ProjectSearchField } from "../components/ProjectSearchField";
import { PROJECT_LIST_PAGE_STEPS } from "../constants";
import {
  groupProjects,
  matchesProjectQuery,
} from "../_helpers/projectList.helper";
import { ProjectForm } from "../components/ProjectForm";
import { useSnackbar } from "notistack";
import { BaseModal } from "../components/BaseModal";
import { Project, User } from "../types";
import { pluralize } from "../_helpers/format.helper";

// the roles the API lets create, update and delete projects
const PROJECT_EDITOR_ROLES = new Set<User["role"]>(["admin", "editor"]);

const ProjectsListPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const projectState = useProjectState();
  const projectDispatch = useProjectDispatch();
  const { user } = useUserState();
  const canEditProjects = !!user && PROJECT_EDITOR_ROLES.has(user.role);
  const { projectList, favoriteProjectIds, recentProjectIds, loading } =
    projectState;

  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useHelpSteps(PROJECT_LIST_PAGE_STEPS);

  const groups = useMemo(
    () => groupProjects(projectList, favoriteProjectIds, recentProjectIds),
    [projectList, favoriteProjectIds, recentProjectIds],
  );
  const favoriteIdSet = useMemo(
    () => new Set(favoriteProjectIds),
    [favoriteProjectIds],
  );
  const matches = useMemo(
    () =>
      [...groups.favorites, ...groups.recent, ...groups.others].filter(
        (project) => matchesProjectQuery(project, query),
      ),
    [groups, query],
  );

  const setQuery = (value: string) =>
    setSearchParams(value ? { q: value } : {}, { replace: true });

  const toggleCreateDialogOpen = () => {
    setCreateDialogOpen(!createDialogOpen);
  };

  const toggleUpdateDialogOpen = () => {
    setUpdateDialogOpen(!updateDialogOpen);
  };

  const toggleDeleteDialogOpen = () => {
    setDeleteDialogOpen(!deleteDialogOpen);
  };

  const renderCard = (project: Project) => {
    const favorite = favoriteIdSet.has(project.id);

    return (
      <ProjectCard
        key={project.id}
        project={project}
        favorite={favorite}
        onToggleFavorite={() => {
          toggleFavoriteProject(projectDispatch, project.id, !favorite).catch(
            (err) => enqueueSnackbar(err, { variant: "error" }),
          );
        }}
        onEdit={
          canEditProjects
            ? () => {
                toggleUpdateDialogOpen();
                setProjectEditState(projectDispatch, project);
              }
            : undefined
        }
        onDelete={
          canEditProjects
            ? () => {
                toggleDeleteDialogOpen();
                setProjectEditState(projectDispatch, project);
              }
            : undefined
        }
      />
    );
  };

  const hasSections = groups.favorites.length + groups.recent.length > 0;

  const renderProjects = () => {
    if (query.trim()) {
      return matches.length ? (
        <ProjectGrid>{matches.map(renderCard)}</ProjectGrid>
      ) : (
        <EmptyState
          icon={<Search />}
          title={`No projects match “${query.trim()}”`}
          description="Search looks at the name, the id and the main branch."
        />
      );
    }
    if (!hasSections) {
      return <ProjectGrid>{groups.others.map(renderCard)}</ProjectGrid>;
    }
    return (
      <Stack spacing={4}>
        {groups.favorites.length > 0 && (
          <ProjectSection title="Favourites">
            {groups.favorites.map(renderCard)}
          </ProjectSection>
        )}
        {groups.recent.length > 0 && (
          <ProjectSection title="Recently opened">
            {groups.recent.map(renderCard)}
          </ProjectSection>
        )}
        {groups.others.length > 0 && (
          <ProjectSection title="Other projects">
            {groups.others.map(renderCard)}
          </ProjectSection>
        )}
      </Stack>
    );
  };

  const renderBody = () => {
    if (projectList.length > 0) {
      return renderProjects();
    }
    if (loading) {
      return (
        <Box role="status" aria-label="Loading projects">
          <SkeletonList />
        </Box>
      );
    }
    return (
      <EmptyState
        icon={<FolderOpenOutlined />}
        title="No projects yet"
        description={
          canEditProjects
            ? "Create the first one with Add project, then point your test runs at it."
            : "Projects shared with you will show up here."
        }
      />
    );
  };

  const submit = (action: Promise<Project>, done: string, close: () => void) =>
    action
      .then((project) => {
        close();
        enqueueSnackbar(`${project.name} ${done}`, { variant: "success" });
      })
      .catch((err) => enqueueSnackbar(err, { variant: "error" }));

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
          {!loading && (
            <Typography variant="body2" color="text.secondary">
              {`${projectList.length} ${pluralize(projectList.length, "project")}`}
            </Typography>
          )}
        </Box>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          width={{ xs: "100%", sm: "auto" }}
        >
          {projectList.length > 0 && (
            <ProjectSearchField value={query} onChange={setQuery} />
          )}
          {canEditProjects && (
            <Button
              variant="contained"
              startIcon={<Add data-testid="AddIcon" />}
              sx={{ flexShrink: 0 }}
              onClick={() => {
                toggleCreateDialogOpen();
                setProjectEditState(projectDispatch);
              }}
            >
              Add project
            </Button>
          )}
        </Stack>
      </Stack>

      {renderBody()}

      {canEditProjects && (
        <>
          <BaseModal
            open={createDialogOpen}
            title={"Create Project"}
            submitButtonText={"Create"}
            onCancel={toggleCreateDialogOpen}
            content={<ProjectForm />}
            onSubmit={() =>
              submit(
                createProject(projectDispatch, projectState.projectEditState),
                "created",
                toggleCreateDialogOpen,
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
              submit(
                updateProject(projectDispatch, projectState.projectEditState),
                "updated",
                toggleUpdateDialogOpen,
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
              submit(
                deleteProject(
                  projectDispatch,
                  projectState.projectEditState.id,
                ),
                "deleted",
                toggleDeleteDialogOpen,
              )
            }
          />
        </>
      )}
    </Container>
  );
};

export default ProjectsListPage;
