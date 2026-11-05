import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Button, Container, Link, Stack } from "@mui/material";
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
import { ProjectForm, SETTINGS_SECTIONS } from "../components/ProjectForm";
import { settingsSectionId } from "../components/ProjectForm/SettingsRow";
import { SkeletonList } from "../components/SkeletonList";
import { ValidatedForm } from "../components/ValidatedForm";

const SectionNav = () => {
  const [active, setActive] = useState<string>(SETTINGS_SECTIONS[0].id);

  return (
    <Box
      component="nav"
      aria-label="Settings sections"
      sx={{ position: { md: "sticky" }, top: { md: 16 }, alignSelf: "start" }}
    >
      <Stack
        direction={{ xs: "row", md: "column" }}
        spacing={{ xs: 2, md: 0.5 }}
      >
        {SETTINGS_SECTIONS.map(({ id, title }) => (
          <Link
            key={id}
            href={`#${settingsSectionId(id)}`}
            underline="none"
            variant="body2"
            aria-current={active === id ? "location" : undefined}
            onClick={(event) => {
              event.preventDefault();
              setActive(id);
              document
                .getElementById(settingsSectionId(id))
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            sx={{
              color: active === id ? "primary.main" : "text.secondary",
              fontWeight: active === id ? 600 : undefined,
              py: 0.5,
            }}
          >
            {title}
          </Link>
        ))}
      </Stack>
    </Box>
  );
};

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

  const dirty =
    !!project && JSON.stringify(projectEditState) !== JSON.stringify(project);

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
      <Container maxWidth="lg" sx={{ py: 4 }}>
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader title="Settings" subtitle={project.name} />
      {projectEditState.id === project.id && (
        <ValidatedForm onSubmit={save}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { md: "180px minmax(0, 1fr)" },
              gap: 2,
            }}
          >
            <SectionNav />
            <Stack spacing={2}>
              <ProjectForm />
              <Stack
                direction="row"
                spacing={1}
                sx={{ justifyContent: "flex-end" }}
              >
                <Button
                  disabled={!dirty || saving}
                  onClick={() => setProjectEditState(projectDispatch, project)}
                >
                  Discard changes
                </Button>
                <Button type="submit" variant="contained" disabled={saving}>
                  Save
                </Button>
              </Stack>
            </Stack>
          </Box>
        </ValidatedForm>
      )}
    </Container>
  );
};

export default ProjectSettingsPage;
