import { Suspense, useEffect, lazy } from "react";
import { GridLegacy as Grid, Box } from "@mui/material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import BuildList from "../components/BuildList";
import ProjectSelect from "../components/ProjectSelect";
import TestRunList from "../components/TestRunList";
import BuildDetails from "../components/BuildDetails";
import { useHelpDispatch, setHelpSteps } from "../contexts";
import {
  PROJECT_PAGE_STEPS,
  LOCATOR_PROJECT_PAGE_BUILD_LIST,
  LOCATOR_PROJECT_PAGE_SELECT_PROJECT,
  LOCATOR_PROJECT_PAGE_TEST_RUN_LIST,
} from "../constants";
import { buildProjectPageUrl, getQueryParams } from "../_helpers/route.helpers";

const loadTestDetailsDialog = () => import("../components/TestDetailsDialog");
const TestDetailsDialog = lazy(() =>
  loadTestDetailsDialog().then((m) => ({ default: m.TestDetailsDialog })),
);

const ProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { buildId, testId: openedRunId } = getQueryParams(useLocation().search);

  // the dialog's chunk loads in the background once a build is open, so the first run opens at once
  useEffect(() => {
    if (buildId) {
      void loadTestDetailsDialog();
    }
  }, [buildId]);
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
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.paper",
            borderRight: 1,
            borderColor: "divider",
          }}
        >
          <Box id={LOCATOR_PROJECT_PAGE_SELECT_PROJECT}>
            <ProjectSelect
              projectId={projectId}
              onProjectSelect={(id) => {
                navigate(buildProjectPageUrl(id));
              }}
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
      {openedRunId && (
        <Suspense fallback={null}>
          <TestDetailsDialog />
        </Suspense>
      )}
    </>
  );
};

export default ProjectPage;
