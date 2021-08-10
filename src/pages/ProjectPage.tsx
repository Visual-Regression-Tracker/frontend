import React, { useEffect } from "react";
import { Grid, Box, makeStyles } from "@material-ui/core";
import { useParams, useHistory } from "react-router-dom";
import BuildList from "../components/BuildList";
import ProjectSelect from "../components/ProjectSelect";
import TestRunList from "../components/TestRunList";
import BuildDetails from "../components/BuildDetails";
import { TestDetailsDialog } from "../components/TestDetailsDialog";
import { useHelpDispatch, setHelpSteps } from "../contexts";
import { CONTENT_PROJECT_PAGE_BUILD_DETAILS, CONTENT_PROJECT_PAGE_BUILD_LIST, CONTENT_PROJECT_PAGE_SELECT_PROJECT, CONTENT_PROJECT_PAGE_TEST_RUN_LIST, LOCATOR_PROJECT_PAGE_BUILD_DETAILS, LOCATOR_PROJECT_PAGE_BUILD_LIST, LOCATOR_PROJECT_PAGE_SELECT_PROJECT, LOCATOR_PROJECT_PAGE_TEST_RUN_LIST } from "../constants/help";

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
      target: "#" + LOCATOR_PROJECT_PAGE_SELECT_PROJECT,
      content: (
        <div>{CONTENT_PROJECT_PAGE_SELECT_PROJECT}</div>
      ),
    },
    {
      target: "#" + LOCATOR_PROJECT_PAGE_BUILD_LIST,
      title: "List of test runs",
      content: (
        <div>
          {CONTENT_PROJECT_PAGE_BUILD_LIST}
        </div>
      ),
    },
    {
      target: "#" + LOCATOR_PROJECT_PAGE_BUILD_DETAILS,
      content: <div>{CONTENT_PROJECT_PAGE_BUILD_DETAILS}</div>,
    },
    {
      target: "#" + LOCATOR_PROJECT_PAGE_TEST_RUN_LIST,
      content: (
        <div>
          {CONTENT_PROJECT_PAGE_TEST_RUN_LIST}
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
          <Box height="9%" id={LOCATOR_PROJECT_PAGE_SELECT_PROJECT}>
            <ProjectSelect
              projectId={projectId}
              onProjectSelect={(id) => history.push(id)}
            />
          </Box>
          <Box height="91%" id={LOCATOR_PROJECT_PAGE_BUILD_LIST}>
            <BuildList />
          </Box>
        </Grid>
        <Grid item xs={9} className={classes.root}>
          <Box height="15%">
            <BuildDetails />
          </Box>
          <Box height="85%" id={LOCATOR_PROJECT_PAGE_TEST_RUN_LIST}>
            <TestRunList />
          </Box>
        </Grid>
      </Grid>
      <TestDetailsDialog />
    </React.Fragment>
  );
};

export default ProjectPage;
