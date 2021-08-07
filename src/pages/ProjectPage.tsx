import React, { useEffect } from "react";
import { Grid, Box, makeStyles } from "@material-ui/core";
import { useParams, useHistory } from "react-router-dom";
import BuildList from "../components/BuildList";
import ProjectSelect from "../components/ProjectSelect";
import TestRunList from "../components/TestRunList";
import BuildDetails from "../components/BuildDetails";
import { TestDetailsDialog } from "../components/TestDetailsDialog";
import { useHelpDispatch, setHelpSteps } from "../contexts";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100%",
  },
}));

const ProjectPage = () => {
  const classes = useStyles();
  const { projectId } = useParams<{ projectId: string }>();
  const history = useHistory();
  const helpDispatch = useHelpDispatch();

  const helpSteps = [
    {
      target: "#select-project",
      content: (
        <div>Select the project for which you want to view details.</div>
      ),
    },
    {
      target: "#build-list",
      title: "List of test runs",
      content: (
        <div>
          If you see 'No Builds', please run your image comparison from any
          client.
        </div>
      ),
    },
    {
      target: "#build-details",
      content: <div>Details of the currently selected build.</div>,
    },
    {
      target: "#test-run-list",
      content: (
        <div>
          On selecting a build, shows all comparisons for the selected build.
        </div>
      ),
    },
  ];

  useEffect(() => {
    setHelpSteps(helpDispatch, helpSteps);
  });

  return (
    <React.Fragment>
      <Grid container className={classes.root}>
        <Grid item xs={3} className={classes.root}>
          <Box height="9%" id="select-project">
            <ProjectSelect
              projectId={projectId}
              onProjectSelect={(id) => history.push(id)}
            />
          </Box>
          <Box height="91%" id="build-list">
            <BuildList />
          </Box>
        </Grid>
        <Grid item xs={9} className={classes.root}>
          <Box height="15%">
            <BuildDetails />
          </Box>
          <Box height="85%" id="test-run-list">
            <TestRunList />
          </Box>
        </Grid>
      </Grid>
      <TestDetailsDialog />
    </React.Fragment>
  );
};

export default ProjectPage;
