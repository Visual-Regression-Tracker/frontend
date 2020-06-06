import React from "react";
import { useParams, Link } from "react-router-dom";
import { TestVariation } from "../types";
import { testVariationService, staticService } from "../services";
import {
  Container,
  Box,
  Grid,
  Card,
  CardMedia,
  makeStyles,
  CardActions,
  Button,
} from "@material-ui/core";
import { buildTestRunUrl } from "../_helpers/route.helpers";
import { TestVariationDetails } from "../components/TestVariationDetails";
import { selectBuild, useBuildDispatch } from "../contexts/build.context";

const useStyles = makeStyles({
  media: {
    height: 600,
    backgroundSize: "contain",
  },
});

const TestVariationDetailsPage: React.FunctionComponent = () => {
  const classes = useStyles();
  const buildDispatch = useBuildDispatch();
  const { testVariationId } = useParams();
  const [testVariation, setTestVariation] = React.useState<TestVariation>();

  React.useEffect(() => {
    if (testVariationId) {
      testVariationService.getDetails(testVariationId).then((item) => {
        setTestVariation(item);
      });
    }
  }, [testVariationId]);

  return (
    <React.Fragment>
      <Container>
        <Box mt={2}>
          {testVariation && (
            <Grid container direction="column" spacing={2}>
              <Grid item>
                <TestVariationDetails testVariation={testVariation} />
              </Grid>
              {testVariation.baselines.map((baseline) => (
                <Grid item key={baseline.id}>
                  <Card>
                    <CardActions>
                      <Button
                        color="primary"
                        component={Link}
                        disabled={!baseline.testRun}
                        onClick={() =>
                          baseline.testRun &&
                          selectBuild(buildDispatch, baseline.testRun.buildId)
                        }
                        to={
                          baseline.testRun
                            ? buildTestRunUrl(testVariation, baseline.testRun)
                            : ""
                        }
                      >
                        {baseline.createdAt}
                      </Button>
                    </CardActions>
                    <CardMedia
                      className={classes.media}
                      image={staticService.getImage(baseline.baselineName)}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>
    </React.Fragment>
  );
};

export default TestVariationDetailsPage;
