import React, { useEffect } from "react";
import { styled } from "@mui/material/styles";
import { Grid, Box } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import BuildList from "../components/BuildList";
import ProjectSelect from "../components/ProjectSelect";
import TestRunList from "../components/TestRunList";
import BuildDetails from "../components/BuildDetails";
import { TestDetailsDialog } from "../components/TestDetailsDialog";
import { useHelpDispatch, setHelpSteps } from "../contexts";
import {
  PROJECT_PAGE_STEPS,
  LOCATOR_PROJECT_PAGE_BUILD_LIST,
  LOCATOR_PROJECT_PAGE_SELECT_PROJECT,
  LOCATOR_PROJECT_PAGE_TEST_RUN_LIST,
} from "../constants";
import { buildProjectPageUrl } from "../_helpers/route.helpers";

const PREFIX = "ProjectPage";

const classes = {
  root: `${PREFIX}-root`,
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled("div")(() => ({
  [`& .${classes.root}`]: {
    height: "100%",
  },
}));

const ProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const helpDispatch = useHelpDispatch();

  useEffect(() => {
    setHelpSteps(helpDispatch, PROJECT_PAGE_STEPS);
  });

  return (
    <Root>
      <Grid container className={classes.root}>
        <Grid item xs={3} className={classes.root}>
          <Box height="9%" id={LOCATOR_PROJECT_PAGE_SELECT_PROJECT}>
            <ProjectSelect
              projectId={projectId}
              onProjectSelect={(id) => navigate(buildProjectPageUrl(id))}
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
    </Root>
  );
};

export default ProjectPage;
