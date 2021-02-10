import React, { useEffect } from "react";
import { Grid, Box, makeStyles } from "@material-ui/core";
import { useParams, useLocation, useHistory } from "react-router-dom";
import BuildList from "../components/BuildList";
import ProjectSelect from "../components/ProjectSelect";
import TestRunList from "../components/TestRunList";
import { useBuildDispatch, selectBuild } from "../contexts";
import BuildDetails from "../components/BuildDetails";
import { TestDetailsDialog } from "../components/TestDetailsDialog";
import { getQueryParams, QueryParams } from "../_helpers/route.helpers";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100%",
  },
}));

const ProjectPage = () => {
  const classes = useStyles();
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const history = useHistory();
  const buildDispatch = useBuildDispatch();

  const queryParams: QueryParams = React.useMemo(() => {
    return getQueryParams(location.search);
  }, [location.search]);

  useEffect(() => {
    if (queryParams.buildId) {
      selectBuild(buildDispatch, queryParams.buildId);
    }
  }, [buildDispatch, queryParams.buildId]);

  return (
    <React.Fragment>
      <Grid container className={classes.root}>
        <Grid item xs={3} className={classes.root}>
          <ProjectSelect
            projectId={projectId}
            onProjectSelect={(id) => history.push(id)}
          />
          <Box height="85%" my={0.5}>
            <BuildList />
          </Box>
        </Grid>
        <Grid item xs={9} className={classes.root}>
          <Box height="15%">
            <BuildDetails />
          </Box>
          <Box height="85%">
            <TestRunList />
          </Box>
        </Grid>
      </Grid>
      <TestDetailsDialog />
    </React.Fragment>
  );
};

export default ProjectPage;
