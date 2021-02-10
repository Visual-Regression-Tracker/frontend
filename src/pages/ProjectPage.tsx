import React, { useEffect } from "react";
import { Grid, Dialog, Box, makeStyles } from "@material-ui/core";
import { useParams, useLocation, useHistory } from "react-router-dom";
import BuildList from "../components/BuildList";
import ProjectSelect from "../components/ProjectSelect";
import qs from "qs";
import TestRunList from "../components/TestRunList";
import TestDetailsModal from "../components/TestDetailsModal";
import {
  useProjectState,
  useBuildState,
  useBuildDispatch,
  selectBuild,
  useTestRunState,
  useTestRunDispatch,
  selectTestRun,
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
  const { selectedBuild } = useBuildState();
  const buildDispatch = useBuildDispatch();
  const projectDispatch = useProjectDispatch();
  const { testRuns, selectedTestRunIndex } = useTestRunState();
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

  console.log("ProjectPage");
  return (
    <React.Fragment>
      <Grid container className={classes.root}>
        <Grid item xs={3} className={classes.root}>
          <ProjectSelect onProjectSelect={(id) => history.push(id)} />
          <Box height="85%" my={0.5}>
            <BuildList />
          </Box>
        </Grid>
        <Grid item xs={9} className={classes.root}>
          <Box height="15%">
            {selectedBuild && <BuildDetails build={selectedBuild} />}
          </Box>
          <Box height="85%">
            <TestRunList />
          </Box>
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
