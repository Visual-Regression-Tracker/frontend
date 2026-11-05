import { Suspense, useEffect, lazy } from "react";
import { Grid, Box } from "@mui/material";
import { useLocation } from "react-router-dom";
import BuildList from "../components/BuildList";
import TestRunList from "../components/TestRunList";
import BuildDetails from "../components/BuildDetails";
import { useHelpSteps } from "../contexts";
import {
  PROJECT_PAGE_STEPS,
  LOCATOR_PROJECT_PAGE_BUILD_LIST,
  LOCATOR_PROJECT_PAGE_TEST_RUN_LIST,
} from "../constants";
import { getQueryParams } from "../_helpers/route.helpers";

const loadTestDetailsDialog = () => import("../components/TestDetailsDialog");
const TestDetailsDialog = lazy(() =>
  loadTestDetailsDialog().then((m) => ({ default: m.TestDetailsDialog })),
);

const ProjectPage = () => {
  const { buildId, testId: openedRunId } = getQueryParams(useLocation().search);

  // the dialog's chunk loads in the background once a build is open, so the first run opens at once
  useEffect(() => {
    if (buildId) {
      void loadTestDetailsDialog();
    }
  }, [buildId]);

  useHelpSteps(PROJECT_PAGE_STEPS);

  return (
    <>
      <Grid container sx={{ height: "100%" }}>
        <Grid
          size={3}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.paper",
            borderRight: 1,
            borderColor: "divider",
          }}
        >
          <Box
            id={LOCATOR_PROJECT_PAGE_BUILD_LIST}
            sx={{ flex: 1, minHeight: 0 }}
          >
            <BuildList />
          </Box>
        </Grid>
        <Grid
          size={9}
          sx={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <BuildDetails />
          <Box
            id={LOCATOR_PROJECT_PAGE_TEST_RUN_LIST}
            sx={{ flex: 1, minHeight: 0 }}
          >
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
