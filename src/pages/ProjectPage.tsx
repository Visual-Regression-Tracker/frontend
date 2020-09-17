import React, { useEffect } from "react";
import {
  Grid,
  Dialog,
  IconButton,
  Box,
  Typography,
  makeStyles,
} from "@material-ui/core";
import { useParams, useLocation, useHistory } from "react-router-dom";
import { TestRun } from "../types";
import BuildList from "../components/BuildList";
import ProjectSelect from "../components/ProjectSelect";
import qs from "qs";
import TestRunList from "../components/TestRunList";
import TestDetailsModal from "../components/TestDetailsModal";
import { NavigateBefore, NavigateNext } from "@material-ui/icons";
import Filters from "../components/Filters";
import { buildTestRunLocation } from "../_helpers/route.helpers";
import {
  useBuildState,
  useBuildDispatch,
  getBuildList,
  selectBuild,
  useTestRunState,
  useTestRunDispatch,
  selectTestRun,
  getTestRunList,
} from "../contexts";
import { useSnackbar } from "notistack";

const getQueryParams = (guery: string) => {
  const queryParams = qs.parse(guery, { ignoreQueryPrefix: true });
  return {
    buildId: queryParams.buildId as string,
    testId: queryParams.testId as string,
  };
};

const useStyles = makeStyles((theme) => ({
  modal: {
    margin: 40,
  },
  button: {
    width: 64,
    height: 64,
    padding: 0,
    position: "fixed",
    top: "50%",
    zIndex: 4000,
  },
  icon: {
    width: 64,
    height: 64,
  },
  buildListContainer: {
    maxHeight: "89vh",
    overflow: "auto",
  },
  testRunContainer: {
    maxHeight: "83vh",
    overflow: "auto",
  },
}));

const ProjectPage = () => {
  const classes = useStyles();
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const { buildList, selectedBuildId } = useBuildState();
  const buildDispatch = useBuildDispatch();
  const { testRuns, selectedTestRunIndex } = useTestRunState();
  const testRunDispatch = useTestRunDispatch();

  // filter
  const [query, setQuery] = React.useState("");
  const [os, setOs] = React.useState("");
  const [device, setDevice] = React.useState("");
  const [browser, setBrowser] = React.useState("");
  const [viewport, setViewport] = React.useState("");
  const [testStatus, setTestStatus] = React.useState("");
  const [filteredTestRuns, setFilteredTestRuns] = React.useState<TestRun[]>([]);

  useEffect(() => {
    if (projectId) {
      getBuildList(buildDispatch, projectId).catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        })
      );
    }
  }, [projectId, buildDispatch, enqueueSnackbar]);

  useEffect(() => {
    if (selectedBuildId) {
      getTestRunList(testRunDispatch, selectedBuildId).catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        })
      );
    }
  }, [selectedBuildId, testRunDispatch, enqueueSnackbar]);

  useEffect(() => {
    const queryParams = getQueryParams(location.search);
    if (queryParams.buildId) {
      selectBuild(buildDispatch, queryParams.buildId);
    } else if (buildList.length > 0) {
      selectBuild(buildDispatch, buildList[0].id);
    }
  }, [buildDispatch, buildList, location.search]);

  useEffect(() => {
    const queryParams = getQueryParams(location.search);
    if (queryParams.testId) {
      selectTestRun(testRunDispatch, queryParams.testId);
    }
  }, [location.search, testRuns, testRunDispatch]);

  useEffect(() => {
    setFilteredTestRuns(
      testRuns.filter(
        (t) =>
          t.name.includes(query) && // by query
          (os ? t.os === os : true) && // by OS
          (device ? t.device === device : true) && // by device
          (viewport ? t.viewport === viewport : true) && // by viewport
          (testStatus ? t.status === testStatus : true) && // by status
          (browser ? t.browser === browser : true) // by browser
      )
    );
  }, [query, os, device, browser, viewport, testStatus, testRuns]);

  return (
    <Grid container>
      <Grid item xs={3}>
        <Grid container direction="column">
          <Grid item>
            <Typography display="inline">Project: </Typography>
            <ProjectSelect selectedId={projectId} />
          </Grid>
        </Grid>
        <Grid item className={classes.buildListContainer}>
          <BuildList />
        </Grid>
      </Grid>
      <Grid item xs={9}>
        <Grid container direction="column">
          <Grid item>
            <Box m={2}>
              <Filters
                items={testRuns}
                queryState={[query, setQuery]}
                osState={[os, setOs]}
                deviceState={[device, setDevice]}
                browserState={[browser, setBrowser]}
                viewportState={[viewport, setViewport]}
                testStatusState={[testStatus, setTestStatus]}
              />
            </Box>
          </Grid>
          <Grid item className={classes.testRunContainer}>
            <TestRunList items={filteredTestRuns} />
            {selectedTestRunIndex !== undefined &&
              testRuns[selectedTestRunIndex] && (
                <Dialog open={true} fullScreen className={classes.modal}>
                  <TestDetailsModal testRun={testRuns[selectedTestRunIndex]} />
                  {selectedTestRunIndex + 1 < testRuns.length && (
                    <IconButton
                      color="secondary"
                      className={classes.button}
                      style={{
                        right: 0,
                      }}
                      onClick={() => {
                        const next = testRuns[selectedTestRunIndex + 1];
                        history.push(buildTestRunLocation(next));
                        selectTestRun(testRunDispatch, next.id);
                      }}
                    >
                      <NavigateNext className={classes.icon} />
                    </IconButton>
                  )}
                  {selectedTestRunIndex > 0 && (
                    <IconButton
                      color="secondary"
                      className={classes.button}
                      style={{
                        left: 0,
                      }}
                      onClick={() => {
                        const prev = testRuns[selectedTestRunIndex - 1];
                        history.push(buildTestRunLocation(prev));
                        selectTestRun(testRunDispatch, prev.id);
                      }}
                    >
                      <NavigateBefore className={classes.icon} />
                    </IconButton>
                  )}
                </Dialog>
              )}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ProjectPage;
