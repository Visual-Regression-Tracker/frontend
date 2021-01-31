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
  useProjectState,
  useBuildState,
  useBuildDispatch,
  selectBuild,
  useTestRunState,
  useTestRunDispatch,
  selectTestRun,
  getTestRunList,
  useProjectDispatch,
  selectProject,
  getBuildList,
} from "../contexts";
import { useSnackbar } from "notistack";
import { ArrowButtons } from "../components/ArrowButtons";
import BuildDetails from "../components/BuildDetails";
import { Pagination } from "@material-ui/lab";

interface QueryParams {
  buildId?: string;
  testId?: string;
}

const getQueryParams = (guery: string): QueryParams => {
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
  const { selectedBuild, selectedBuildId, total, take } = useBuildState();
  const buildDispatch = useBuildDispatch();
  const { selectedProjectId } = useProjectState();
  const projectDispatch = useProjectDispatch();
  const {
    testRuns,
    selectedTestRunIndex,
    total: testRunTotal,
    take: testRunTake,
  } = useTestRunState();
  const testRunDispatch = useTestRunDispatch();

  const queryParams: QueryParams = React.useMemo(
    () => getQueryParams(location.search),
    [location.search]
  );

  useEffect(() => {
    if (projectId) {
      selectProject(projectDispatch, projectId);
    }
  }, [projectId, projectDispatch]);

  useEffect(() => {
    if (queryParams.buildId) {
      selectBuild(buildDispatch, queryParams.buildId);
    }
  }, [buildDispatch, queryParams.buildId]);

  useEffect(() => {
    if (queryParams.testId) {
      selectTestRun(testRunDispatch, queryParams.testId);
    }
  }, [queryParams.testId, testRunDispatch]);

  const getTestRunListCalback: any = React.useCallback(
    (page: number) =>
      selectedBuildId &&
      getTestRunList(testRunDispatch, selectedBuildId, page).catch(
        (err: string) =>
          enqueueSnackbar(err, {
            variant: "error",
          })
      ),
    [testRunDispatch, enqueueSnackbar, selectedBuildId]
  );

  const getBuildListCalback: any = React.useCallback(
    (page: number) =>
      selectedProjectId &&
      getBuildList(buildDispatch, selectedProjectId, page).catch(
        (err: string) =>
          enqueueSnackbar(err, {
            variant: "error",
          })
      ),
    [buildDispatch, enqueueSnackbar, selectedProjectId]
  );

  React.useEffect(() => {
    getTestRunListCalback(1);
  }, [getTestRunListCalback]);

  React.useEffect(() => {
    getBuildListCalback(1);
  }, [getBuildListCalback]);

  return (
    <React.Fragment>
      <Grid container className={classes.root}>
        <Grid item xs={3} className={classes.root}>
          <ProjectSelect onProjectSelect={(id) => history.push(id)} />
          <Box height="85%" my={0.5}>
            <BuildList />
          </Box>
          <Grid container justify="center">
            <Grid item>
              <Pagination
                size="small"
                defaultPage={1}
                count={Math.ceil(total / take)}
                onChange={(event, page) => getBuildListCalback(page)}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={9} className={classes.root}>
          {selectedBuild && <BuildDetails build={selectedBuild} />}
          <Box height="80%" my={0.5}>
            <TestRunList items={testRuns} />
          </Box>
          <Grid container justify="center">
            <Grid item>
              <Pagination
                size="small"
                defaultPage={1}
                count={Math.ceil(testRunTotal / testRunTake)}
                onChange={(event, page) => getTestRunListCalback(page)}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      {selectedTestRunIndex !== undefined && testRuns[selectedTestRunIndex] && (
        <Dialog open={true} fullScreen className={classes.modal}>
          <TestDetailsModal testRun={testRuns[selectedTestRunIndex]} />
          <ArrowButtons
            testRuns={testRuns}
            selectedTestRunIndex={selectedTestRunIndex}
          />
        </Dialog>
      )}
    </React.Fragment>
  );
};

export default ProjectPage;
