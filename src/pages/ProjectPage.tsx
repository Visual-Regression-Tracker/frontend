import React, { useEffect } from "react";
import { Grid, Dialog, Box, makeStyles } from "@material-ui/core";
import { useParams, useLocation, useHistory } from "react-router-dom";
import { TestRun } from "../types";
import BuildList from "../components/BuildList";
import ProjectSelect from "../components/ProjectSelect";
import qs from "qs";
import TestRunList from "../components/TestRunList";
import TestDetailsModal from "../components/TestDetailsModal";
import Filters from "../components/Filters";
import {
  useBuildState,
  useBuildDispatch,
  selectBuild,
  useTestRunState,
  useTestRunDispatch,
  selectTestRun,
  getTestRunList,
  useProjectDispatch,
  selectProject,
} from "../contexts";
import { useSnackbar } from "notistack";
import { ArrowButtons } from "../components/ArrowButtons";
import BuildDetails from "../components/BuildDetails";

const getQueryParams = (guery: string) => {
  const queryParams = qs.parse(guery, { ignoreQueryPrefix: true });
  return {
    buildId: queryParams.buildId as string,
    testId: queryParams.testId as string,
  };
};

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100%",
  },
  modal: {
    margin: 40,
  },
}));

const ProjectPage = () => {
  const classes = useStyles();
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedBuild, selectedBuildId } = useBuildState();
  const buildDispatch = useBuildDispatch();
  const projectDispatch = useProjectDispatch();
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
      selectProject(projectDispatch, projectId);
    }
  }, [projectId, projectDispatch]);

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
    }
  }, [buildDispatch, location.search]);

  useEffect(() => {
    const queryParams = getQueryParams(location.search);
    if (queryParams.testId) {
      selectTestRun(testRunDispatch, queryParams.testId);
    }
  }, [location.search, testRunDispatch]);

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
    <Grid container className={classes.root}>
      <Grid item xs={3} className={classes.root}>
        <Box height="8%" mx={1}>
          <ProjectSelect onProjectSelect={(id) => history.push(id)} />
        </Box>
        <Box height="92%">
          <BuildList />
        </Box>
      </Grid>
      <Grid item xs={9} className={classes.root}>
        <Box height="17%">
          {selectedBuild && <BuildDetails build={selectedBuild} />}
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
        <Box height="83%">
          <TestRunList items={filteredTestRuns} />
          {selectedTestRunIndex !== undefined &&
            testRuns[selectedTestRunIndex] && (
              <Dialog open={true} fullScreen className={classes.modal}>
                <TestDetailsModal testRun={testRuns[selectedTestRunIndex]} />
                <ArrowButtons
                  testRuns={testRuns}
                  selectedTestRunIndex={selectedTestRunIndex}
                />
              </Dialog>
            )}
        </Box>
      </Grid>
    </Grid>
  );
};

export default ProjectPage;
