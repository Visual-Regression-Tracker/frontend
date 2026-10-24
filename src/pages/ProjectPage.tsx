import React, { useEffect } from "react";
import { Grid, Box } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import BuildList from "../components/BuildList";
import ProjectSelect from "../components/ProjectSelect";
import TestRunList from "../components/TestRunList";
import BuildDetails from "../components/BuildDetails";
import { TestDetailsDialog } from "../components/TestDetailsDialog";
import { useHelpDispatch, setHelpSteps } from "../contexts";
import {
  PROJECT_PAGE_STEPS,
  LOCATOR_PROJECT_PAGE_BUILD_LIST,
  LOCATOR_PROJECT_PAGE_SELECT_PROJECT,
  LOCATOR_PROJECT_PAGE_TEST_RUN_LIST,
} from "../constants";
import { buildProjectPageUrl } from "../_helpers/route.helpers";

const ProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const helpDispatch = useHelpDispatch();

  useEffect(() => {
    setHelpSteps(helpDispatch, PROJECT_PAGE_STEPS);
  });

  return (
    <>
      <Grid container sx={{ height: "100%" }}>
        <Grid
          item
          xs={3}
          sx={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <Box id={LOCATOR_PROJECT_PAGE_SELECT_PROJECT}>
            <ProjectSelect
              projectId={projectId}
              onProjectSelect={(id) => navigate(buildProjectPageUrl(id))}
            />
          </Box>
          <Box flex={1} minHeight={0} id={LOCATOR_PROJECT_PAGE_BUILD_LIST}>
            <BuildList />
          </Box>
        </Grid>
        <Grid
          item
          xs={9}
          sx={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <BuildDetails />
          <Box flex={1} minHeight={0} id={LOCATOR_PROJECT_PAGE_TEST_RUN_LIST}>
            <TestRunList />
          </Box>
        </Grid>
      </Grid>
      <TestDetailsDialog />
    </>
  );
};

export default ProjectPage;
