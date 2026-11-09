import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@mui/material";
import { FolderOffOutlined } from "@mui/icons-material";
import { routes } from "../constants";
import { useProjectState } from "../contexts";
import { EmptyState } from "./EmptyState";

export const RequireProject = ({ children }: { children: ReactNode }) => {
  const { projectId } = useParams();
  const { projectList, loading, loadFailed } = useProjectState();

  if (loading && projectList.length === 0) {
    return <></>;
  }

  if (!loadFailed && !projectList.some((project) => project.id === projectId)) {
    return (
      <EmptyState
        icon={<FolderOffOutlined />}
        title="Project not found"
        description="It may have been deleted, or the link is wrong."
        action={
          <Button
            component={Link}
            to={routes.PROJECT_LIST_PAGE}
            variant="contained"
          >
            Back to projects
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
};
