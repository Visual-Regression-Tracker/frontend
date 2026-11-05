import { Box, Tab, Tabs } from "@mui/material";
import { Link } from "react-router-dom";
import { useUserState } from "../contexts";
import { PROJECT_EDITOR_ROLES } from "../constants";
import {
  type ProjectTab,
  type ShellRoute,
  buildProjectTabUrl,
} from "../_helpers/route.helpers";
import { useShellProject } from "./useShellProject";

const TABS: { tab: ProjectTab; label: string }[] = [
  { tab: "builds", label: "Builds" },
  { tab: "variations", label: "Variations" },
  { tab: "statistics", label: "Statistics" },
  { tab: "settings", label: "Settings" },
];

export const ProjectTabs = ({ route }: { route: ShellRoute }) => {
  const { user } = useUserState();
  const project = useShellProject(route);
  const canEdit = !!user && PROJECT_EDITOR_ROLES.includes(user.role);

  if (!project) {
    return null;
  }
  const { projectId, tab } = project;

  return (
    <Box
      component="nav"
      aria-label="Project"
      sx={{
        px: { xs: 1, sm: 3 },
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Tabs
        value={tab}
        variant="scrollable"
        scrollButtons={false}
        sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40 } }}
      >
        {TABS.filter((item) => canEdit || item.tab !== "settings").map(
          (item) => (
            <Tab
              key={item.tab}
              value={item.tab}
              label={item.label}
              component={Link}
              to={buildProjectTabUrl(item.tab, projectId)}
            />
          ),
        )}
      </Tabs>
    </Box>
  );
};
