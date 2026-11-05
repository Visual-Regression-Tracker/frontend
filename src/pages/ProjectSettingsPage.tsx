import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Button, Container, Paper } from "@mui/material";
import { SearchOff } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import {
  setProjectEditState,
  updateProject,
  useProjectDispatch,
  useProjectState,
} from "../contexts";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { ProjectForm } from "../components/ProjectForm";
import { SkeletonList } from "../components/SkeletonList";
import { ValidatedForm } from "../components/ValidatedForm";

const ProjectSettingsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const { projectList, projectEditState, loading } = useProjectState();
  const projectDispatch = useProjectDispatch();
  const [saving, setSaving] = useState(false);

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

  const save = () => {
    setSaving(true);
    updateProject(projectDispatch, projectEditState)
      .then((saved) =>
        enqueueSnackbar(`${saved.name} updated`, { variant: "success" }),
      )
      .catch((err: string) => enqueueSnackbar(err, { variant: "error" }))
      .finally(() => setSaving(false));
  };

  if (!project) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
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
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader title="Settings" subtitle={project.name} />
      {projectEditState.id === project.id && (
        <ValidatedForm onSubmit={save}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <ProjectForm />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              <Button type="submit" variant="contained" disabled={saving}>
                Save
              </Button>
            </Box>
          </Paper>
        </ValidatedForm>
      )}
    </Container>
  );
};

export default ProjectSettingsPage;
