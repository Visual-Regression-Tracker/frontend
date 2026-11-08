import { useEffect, useState } from "react";
import { Box, Breadcrumbs, Button, Popover, Typography } from "@mui/material";
import { ArrowDropDown } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import {
  selectProject,
  useProjectDispatch,
  useProjectState,
  useVariationCrumb,
} from "../contexts";
import { LOCATOR_PROJECT_PAGE_SELECT_PROJECT, routes } from "../constants";
import {
  type ProjectTab,
  type ShellRoute,
  buildProjectTabUrl,
  buildVariationListUrl,
} from "../_helpers/route.helpers";
import { ProjectMenuContent } from "./ProjectMenuContent";
import { useShellProject } from "./useShellProject";

const crumbLink = {
  color: "text.secondary",
  textDecoration: "none",
  "&:hover": { textDecoration: "underline" },
} as const;

const ProjectCrumb = ({
  projectId,
  tab,
}: {
  projectId: string;
  tab: ProjectTab;
}) => {
  const navigate = useNavigate();
  const projectDispatch = useProjectDispatch();
  const { projectList, selectedProjectId } = useProjectState();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (projectId !== selectedProjectId) {
      selectProject(projectDispatch, projectId);
    }
  }, [projectId, selectedProjectId, projectDispatch]);

  const name =
    projectList.find((project) => project.id === projectId)?.name ?? projectId;

  if (projectList.length === 0) {
    return (
      <Typography
        id={LOCATOR_PROJECT_PAGE_SELECT_PROJECT}
        noWrap
        sx={{ color: "text.primary", fontWeight: 600 }}
      >
        {name}
      </Typography>
    );
  }

  return (
    <>
      <Button
        id={LOCATOR_PROJECT_PAGE_SELECT_PROJECT}
        color="inherit"
        aria-haspopup="dialog"
        aria-expanded={!!anchor}
        endIcon={<ArrowDropDown />}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ fontWeight: 600, minWidth: 0, textTransform: "none" }}
      >
        <Typography noWrap component="span" sx={{ fontWeight: "inherit" }}>
          {name}
        </Typography>
      </Button>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        slotProps={{
          paper: {
            role: "dialog",
            "aria-label": "Switch project",
            sx: { width: 320, maxWidth: "90vw" },
          },
        }}
      >
        <ProjectMenuContent
          currentId={projectId}
          onSelect={(project) => {
            setAnchor(null);
            void navigate(buildProjectTabUrl(tab, project.id));
          }}
        />
      </Popover>
    </>
  );
};

export const ProjectBreadcrumb = ({ route }: { route: ShellRoute }) => {
  const variation = useVariationCrumb();
  const project = useShellProject(route);

  if (route.kind === "users") {
    return (
      <Breadcrumbs separator="/" aria-label="Breadcrumb">
        <Typography sx={{ color: "text.secondary" }}>Admin</Typography>
        <Typography sx={{ fontWeight: 600 }}>Users</Typography>
      </Breadcrumbs>
    );
  }

  if (route.kind === "newProject") {
    return (
      <Breadcrumbs separator="/" aria-label="Breadcrumb">
        <Box component={Link} to={routes.PROJECT_LIST_PAGE} sx={crumbLink}>
          Projects
        </Box>
        <Typography sx={{ fontWeight: 600 }}>Add project</Typography>
      </Breadcrumbs>
    );
  }

  if (route.kind === "profile") {
    return (
      <Breadcrumbs separator="/" aria-label="Breadcrumb">
        <Typography sx={{ fontWeight: 600 }}>Profile</Typography>
      </Breadcrumbs>
    );
  }

  return (
    <Breadcrumbs
      separator="/"
      aria-label="Breadcrumb"
      sx={{ minWidth: 0, "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" } }}
    >
      <Box component={Link} to={routes.PROJECT_LIST_PAGE} sx={crumbLink}>
        Projects
      </Box>
      {project && <ProjectCrumb {...project} />}
      {route.kind === "variation" && variation && (
        <Box
          component={Link}
          to={buildVariationListUrl(variation.projectId)}
          sx={crumbLink}
        >
          Variations
        </Box>
      )}
      {route.kind === "variation" && variation && (
        <Typography noWrap sx={{ fontWeight: 600 }}>
          {variation.name}
        </Typography>
      )}
    </Breadcrumbs>
  );
};
