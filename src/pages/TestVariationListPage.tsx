import React from "react";
import TestVariationList from "../components/TestVariationList";
import { useParams } from "react-router-dom";
import { TestVariation } from "../types";
import { testVariationService } from "../services";
import { Container, Box, Grid, Typography } from "@material-ui/core";
import ProjectSelect from "../components/ProjectSelect";

const TestVariationListPage: React.FunctionComponent = () => {
  const { projectId } = useParams();
  const [testVariations, setTestVariations] = React.useState<TestVariation[]>(
    []
  );

  React.useEffect(() => {
    if (projectId) {
      testVariationService.getList(projectId).then((testVariations) => {
        setTestVariations(testVariations);
      });
    }
  }, [projectId]);

  return (
    <React.Fragment>
      <Container>
        <Box mt={2}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <Typography display="inline">Project: </Typography>
              <ProjectSelect selectedId={projectId} />
            </Grid>
            <Grid item>
              <TestVariationList items={testVariations} />
            </Grid>
          </Grid>
        </Box>
      </Container>
    </React.Fragment>
  );
};

export default TestVariationListPage;
