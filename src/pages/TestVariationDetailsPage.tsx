import React from "react";
import { useParams, useHistory } from "react-router-dom";
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
  Typography,
} from "@material-ui/core";
import {
  buildProjectPageUrl,
  buildTestRunLocation,
} from "../_helpers/route.helpers";
import { TestVariationDetails } from "../components/TestVariationDetails";
import {
  selectBuild,
  useBuildDispatch,
  useTestRunDispatch,
  selectTestRun,
} from "../contexts";
import { useSnackbar } from "notistack";
import { formatDateTime } from "../_helpers/format.helper";
import TestStatusChip from "../components/TestStatusChip";

const useStyles = makeStyles({
  media: {
    height: 600,
    objectFit: "contain",
  },
});

const TestVariationDetailsPage: React.FunctionComponent = () => {
  const classes = useStyles();
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const buildDispatch = useBuildDispatch();
  const testRunDispatch = useTestRunDispatch();
  const { testVariationId } = useParams<{ testVariationId: string }>();
  const [testVariation, setTestVariation] = React.useState<TestVariation>();

  React.useEffect(() => {
    if (testVariationId) {
      testVariationService
        .getDetails(testVariationId)
        .then((item) => {
          setTestVariation(item);
        })
        .catch((err) =>
          enqueueSnackbar(err, {
            variant: "error",
          })
        );
    }
  }, [testVariationId, enqueueSnackbar]);

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
                        disabled={!baseline.testRun}
                        onClick={() => {
                          if (baseline.testRun) {
                            history.push({
                              pathname: buildProjectPageUrl(
                                testVariation.projectId
                              ),
                              ...buildTestRunLocation(
                                baseline.testRun.buildId,
                                baseline.testRunId
                              ),
                            });
                            selectBuild(
                              buildDispatch,
                              baseline.testRun.buildId
                            ).then(() =>
                              selectTestRun(
                                testRunDispatch,
                                baseline.testRun.id
                              )
                            );
                          }
                        }}
                      >
                        Test Run
                      </Button>
                      <TestStatusChip status={baseline.testRun.status} />
                      {baseline.user && (
                        <Typography>
                          {`${baseline.user.firstName} ${baseline.user.lastName} <${baseline.user.email}>`}
                        </Typography>
                      )}
                      <Typography>
                        {formatDateTime(baseline.createdAt)}
                      </Typography>
                    </CardActions>
                    <CardMedia
                      component="img"
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
