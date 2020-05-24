import React from "react";
import { useParams, Link } from "react-router-dom";
import { TestVariation } from "../types";
import { testVariationService, staticService } from "../services";
import {
  Container,
  Box,
  Grid,
  Typography,
  Card,
  CardMedia,
  makeStyles,
  CardActions,
  Button,
} from "@material-ui/core";
import { buildTestRunUrl } from "../_helpers/route.helpers";

const useStyles = makeStyles({
  media: {
    height: 600,
    backgroundSize: "contain",
  },
});

const TestVariationDetailsPage: React.FunctionComponent = () => {
  const classes = useStyles();
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
              <Typography>{testVariation.name}</Typography>

              <Grid container spacing={2}>
                <Grid item>
                  <Typography>OS: {testVariation.os}</Typography>
                </Grid>
                <Grid item>
                  <Typography>Browser: {testVariation.browser}</Typography>
                </Grid>
                <Grid item>
                  <Typography>Viewport: {testVariation.viewport}</Typography>
                </Grid>
              </Grid>
              {testVariation.baselines.map((baseline) => (
                <Grid item key={baseline.id}>
                  <Card>
                    <CardActions>
                      <Button
                        color="primary"
                        component={Link}
                        to={buildTestRunUrl(testVariation, baseline.testRun)}
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
