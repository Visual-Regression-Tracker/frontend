import React from "react";
import { styled } from "@mui/material/styles";
import { useParams, useNavigate } from "react-router-dom";
import { TestVariation } from "../types";
import { testVariationService, staticService } from "../services";
import {
  Container,
  Box,
  Grid,
  Card,
  CardMedia,
  CardActions,
  Button,
  Typography,
} from "@mui/material";
import {
  buildProjectPageUrl,
  buildTestRunLocation,
} from "../_helpers/route.helpers";
import { TestVariationDetails } from "../components/TestVariationDetails";
import { useSnackbar } from "notistack";
import { formatDateTime } from "../_helpers/format.helper";
import TestStatusChip from "../components/TestStatusChip";
import { Baseline } from "../types/baseline";
const PREFIX = "TestVariationDetailsPage";

const classes = {
  media: `${PREFIX}-media`,
};

const StyledContainer = styled(Container)({
  [`& .${classes.media}`]: {
    height: 600,
    objectFit: "contain",
  },
});

const TestVariationDetailsPage: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
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
          }),
        );
    }
  }, [testVariationId, enqueueSnackbar]);

  return (
    <StyledContainer>
      <Box mt={2}>
        {testVariation && (
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <TestVariationDetails testVariation={testVariation} />
            </Grid>
            {testVariation.baselines.map((baseline: Baseline) => (
              <Grid item key={baseline.id}>
                <Card>
                  <CardActions>
                    <Button
                      color="primary"
                      disabled={!baseline.testRun}
                      onClick={() => {
                        const { testRun } = baseline;
                        if (testRun) {
                          navigate({
                            pathname: buildProjectPageUrl(
                              testVariation.projectId,
                            ),
                            ...buildTestRunLocation(
                              testRun.buildId,
                              testRun.id,
                            ),
                          });
                        }
                      }}
                    >
                      Test Run
                    </Button>
                    {baseline.testRun && (
                      <Box ml={1}>
                        <TestStatusChip status={baseline.testRun.status} />
                      </Box>
                    )}
                    {baseline.user && (
                      <Typography ml={1}>
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
    </StyledContainer>
  );
};

export default TestVariationDetailsPage;
