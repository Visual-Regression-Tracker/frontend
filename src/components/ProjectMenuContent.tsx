import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  InputAdornment,
  ListSubheader,
  MenuItem,
  MenuList,
  TextField,
  Typography,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { useProjectState } from "../contexts";
import {
  matchesProjectQuery,
  projectSections,
} from "../_helpers/projectList.helper";
import type { Project } from "../types";

export const ProjectMenuContent = ({
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
          scrollPaddingTop: "40px",
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
              <Typography
                noWrap
                title={project.name}
                sx={{ fontSize: "inherit" }}
              >
                {project.name}
              </Typography>
            </MenuItem>
          )),
        ])}
      </MenuList>
    </>
  );
};
