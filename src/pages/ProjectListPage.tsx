import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Typography, Button, Box, Stack } from "@mui/material";
import {
  useProjectState,
  useProjectDispatch,
  deleteProject,
  setProjectEditState,
  toggleFavoriteProject,
  useUserState,
} from "../contexts";
import { Add, FolderOpenOutlined, Search } from "@mui/icons-material";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { SkeletonList } from "../components/SkeletonList";
import { ProjectCard } from "../components/ProjectCard";
import { ProjectGrid, ProjectSection } from "../components/ProjectGrid";
import { ProjectSearchField } from "../components/ProjectSearchField";
import { PROJECT_EDITOR_ROLES, routes } from "../constants";
import { buildProjectSettingsUrl } from "../_helpers/route.helpers";
import {
  groupProjects,
  matchesProjectQuery,
} from "../_helpers/projectList.helper";
import { useSnackbar } from "notistack";
import { BaseModal } from "../components/BaseModal";
import { Project } from "../types";
import { pluralize } from "../_helpers/format.helper";

const ProjectsListPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const projectState = useProjectState();
  const projectDispatch = useProjectDispatch();
  const { user } = useUserState();
  const canEditProjects = !!user && PROJECT_EDITOR_ROLES.includes(user.role);
  const { projectList, favoriteProjectIds, recentProjectIds, loading } =
    projectState;

  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
            (err: string) => enqueueSnackbar(err, { variant: "error" }),
          );
        }}
        onEdit={
          canEditProjects
            ? () => {
                void navigate(buildProjectSettingsUrl(project.id));
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
          description="Search looks at the name and the main branch."
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
      .catch((err: string) => enqueueSnackbar(err, { variant: "error" }));

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        subtitle={
          !loading &&
          `${projectList.length} ${pluralize(projectList.length, "project")}`
        }
        actions={
          <>
            {projectList.length > 0 && (
              <ProjectSearchField value={query} onChange={setQuery} />
            )}
            {canEditProjects && (
              <Button
                variant="contained"
                startIcon={<Add data-testid="AddIcon" />}
                sx={{ flexShrink: 0 }}
                onClick={() => void navigate(routes.PROJECT_NEW_PAGE)}
              >
                Add project
              </Button>
            )}
          </>
        }
      />

      {renderBody()}

      {canEditProjects && (
        <>
          <BaseModal
            open={deleteDialogOpen}
            title={"Delete project"}
            submitButtonText={"Delete"}
            submitColor="error"
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
    </PageContainer>
  );
};

export default ProjectsListPage;
