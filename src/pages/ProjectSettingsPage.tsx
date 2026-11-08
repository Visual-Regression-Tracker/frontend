import { useEffect, useRef, useState } from "react";
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
import type { ProjectDto } from "../types";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { ProjectForm, SETTINGS_SECTIONS } from "../components/ProjectForm";
import { settingsSectionId } from "../components/ProjectForm/SettingsRow";
import { SkeletonList } from "../components/SkeletonList";
import { ValidatedForm } from "../components/ValidatedForm";

const ACTIVE_OFFSET = 80;

const sectionInView = (main: HTMLElement): string => {
  const atEnd =
    main.scrollHeight > main.clientHeight &&
    main.scrollTop + main.clientHeight >= main.scrollHeight - 2;
  if (atEnd) {
    return SETTINGS_SECTIONS[SETTINGS_SECTIONS.length - 1].id;
  }
  const line = main.getBoundingClientRect().top + ACTIVE_OFFSET;
  const passed = SETTINGS_SECTIONS.filter(
    ({ id }) =>
      (document.getElementById(settingsSectionId(id))?.getBoundingClientRect()
        .top ?? Infinity) <= line,
  );
  return (passed[passed.length - 1] ?? SETTINGS_SECTIONS[0]).id;
};

const SectionNav = () => {
  const [active, setActive] = useState<string>(SETTINGS_SECTIONS[0].id);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const main = navRef.current?.closest("main");
    if (!main) {
      return;
    }
    const follow = () => setActive(sectionInView(main));
    main.addEventListener("scroll", follow, { passive: true });
    return () => main.removeEventListener("scroll", follow);
  }, []);

  return (
    <Box
      ref={navRef}
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
                  onClick={() => setProjectEditState(projectDispatch, clean)}
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
