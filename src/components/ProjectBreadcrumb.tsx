import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Breadcrumbs,
  Button,
  InputAdornment,
  ListSubheader,
  MenuItem,
  MenuList,
  Popover,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowDropDown, Search } from "@mui/icons-material";
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
import {
  matchesProjectQuery,
  projectSections,
} from "../_helpers/projectList.helper";
import { useShellProject } from "./useShellProject";
import type { Project } from "../types";

const crumbLink = {
  color: "text.secondary",
  textDecoration: "none",
  "&:hover": { textDecoration: "underline" },
} as const;

const ProjectMenuContent = ({
  currentId,
  onSelect,
}: {
  currentId: string;
  onSelect: (project: Project) => void;
}) => {
  const { projectList, favoriteProjectIds, recentProjectIds } =
    useProjectState();
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const { groups, showTitles } = useMemo(() => {
    const { sections, titled } = projectSections(
      projectList,
      favoriteProjectIds,
      recentProjectIds,
    );
    return {
      groups: sections
        .map(({ title, projects }) => ({
          title,
          projects: projects.filter((project) =>
            matchesProjectQuery(project, query),
          ),
        }))
        .filter(({ projects }) => projects.length > 0),
      showTitles: titled,
    };
  }, [projectList, favoriteProjectIds, recentProjectIds, query]);

  const handleSearchKey = (event: KeyboardEvent) => {
    if (event.key === "Enter" && groups[0]) {
      event.preventDefault();
      onSelect(groups[0].projects[0]);
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      listRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    }
  };

  return (
    <>
      <Box sx={{ p: 1.5, pb: 0.5 }}>
        <TextField
          inputRef={searchRef}
          fullWidth
          size="small"
          type="search"
          placeholder="Find project"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleSearchKey}
          slotProps={{
            htmlInput: { "aria-label": "Find project" },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
      <MenuList
        ref={listRef}
        sx={{
          bgcolor: "inherit",
          maxHeight: 360,
          overflow: "auto",
          py: 0,
          pb: 1,
        }}
      >
        {groups.length === 0 && (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", px: 2, py: 1 }}
          >
            No projects match
          </Typography>
        )}
        {groups.flatMap(({ title, projects }, index) => [
          showTitles && (
            <ListSubheader
              key={title}
              component="li"
              sx={{
                ...(index > 0 && { borderTop: 1, borderColor: "divider" }),
                bgcolor: "inherit",
                color: "text.secondary",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                lineHeight: "32px",
                mt: index > 0 ? 0.5 : 0,
                pt: index > 0 ? 0.5 : 0,
                px: 2,
              }}
            >
              {title}
            </ListSubheader>
          ),
          ...projects.map((project) => (
            <MenuItem
              key={`${title}:${project.id}`}
              selected={project.id === currentId}
              onClick={() => onSelect(project)}
              sx={{ borderRadius: 1, minHeight: 40, mx: 1, my: 0.25, px: 1.5 }}
            >
              <Typography noWrap sx={{ fontSize: "inherit" }}>
                {project.name}
              </Typography>
            </MenuItem>
          )),
        ])}
      </MenuList>
    </>
  );
};

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
