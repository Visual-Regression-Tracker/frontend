import React, { useEffect } from "react";
import { Grid, Box, makeStyles } from "@material-ui/core";
import { useParams, useHistory } from "react-router-dom";
import BuildList from "../components/BuildList";
import ProjectSelect from "../components/ProjectSelect";
import TestRunList from "../components/TestRunList";
import BuildDetails from "../components/BuildDetails";
import { TestDetailsDialog } from "../components/TestDetailsDialog";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100%",
  },
}));

const ProjectPage = (props: any) => {
  const classes = useStyles();
  const { projectId } = useParams<{ projectId: string }>();
  const history = useHistory();


  const helpsteps = [{
    target: "#select-project",
    content: (<div>Select the project for which you want to view details.</div>),
  }, {
    target: "#build-list",
    content: (<div>List of test runs. If you see 'No Builds', please run your image comparison from any client.</div>),
  }, {
    target: "#build-details",
    content: (<div>Details of the currently selected build.</div>),
  }, {
    target: "#test-run-list",
    content: (<div>List of all comparisons for the selected build.</div>),
  }];

  useEffect(() => {
    props.populateHelpSteps(helpsteps);
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
          <Box height="91%" id="build-list" >
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
