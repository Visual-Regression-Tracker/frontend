import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Button } from "@mui/material";
import { SearchOff } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import {
  setProjectEditState,
  updateProject,
  useProjectDispatch,
  useProjectState,
} from "../contexts";
import type { ProjectDto } from "../types";
import { EmptyState } from "../components/EmptyState";
import { PageContainer } from "../components/PageContainer";
import { ProjectFormLayout } from "../components/ProjectForm/ProjectFormLayout";
import { SkeletonList } from "../components/SkeletonList";
import { ValidatedForm } from "../components/ValidatedForm";

const ProjectSettingsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const { projectList, projectEditState, loading } = useProjectState();
  const projectDispatch = useProjectDispatch();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<ProjectDto>();

  const project = projectList.find((item) => item.id === projectId);

  useEffect(() => {
    if (project && projectEditState.id !== project.id) {
      setProjectEditState(projectDispatch, project);
    }
  }, [project, projectEditState.id, projectDispatch]);

  useEffect(
    () => () => setProjectEditState(projectDispatch),
    [projectDispatch],
  );

  const clean = saved?.id === project?.id ? saved : project;
  const dirty =
    !!clean && JSON.stringify(projectEditState) !== JSON.stringify(clean);

  const save = () => {
    setSaving(true);
    const sent = projectEditState;
    updateProject(projectDispatch, sent)
      .then((updated) => {
        setSaved(sent);
        enqueueSnackbar(`${updated.name} updated`, { variant: "success" });
      })
      .catch((err: string) => enqueueSnackbar(err, { variant: "error" }))
      .finally(() => setSaving(false));
  };

  if (!project) {
    return (
      <PageContainer>
        {loading ? (
          <Box role="status" aria-label="Loading project">
            <SkeletonList />
          </Box>
        ) : (
          <EmptyState
            icon={<SearchOff />}
            title="Project not found"
            description="It may have been deleted, or the link is wrong."
          />
        )}
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {projectEditState.id === project.id && (
        <ValidatedForm onSubmit={save}>
          <ProjectFormLayout
            actions={
              <>
                <Button
                  disabled={!dirty || saving}
                  onClick={() => setProjectEditState(projectDispatch, clean)}
                >
                  Discard changes
                </Button>
                <Button type="submit" variant="contained" disabled={saving}>
                  Save
                </Button>
              </>
            }
          />
        </ValidatedForm>
      )}
    </PageContainer>
  );
};

export default ProjectSettingsPage;
