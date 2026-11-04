import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TestVariation } from "../types";
import { testVariationService, staticService } from "../services";
import {
  Container,
  Box,
  Card,
  CardMedia,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { imageSurface } from "../theme/tokens";
import {
  buildProjectPageUrl,
  buildTestRunLocation,
} from "../_helpers/route.helpers";
import { TestVariationDetails } from "../components/TestVariationDetails";
import { useSnackbar } from "notistack";
import { StatusChip } from "../components/StatusChip";
import { DateLabel } from "../components/DateLabel";
import { NoiseHintChip } from "../components/TestRunList/NoiseHintChip";
import { Baseline } from "../types/baseline";
import { useNoiseAnalysisAvailable } from "../contexts";

const TestVariationDetailsPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { testVariationId } = useParams<{ testVariationId: string }>();
  const [testVariation, setTestVariation] = useState<TestVariation>();
  const noiseAvailable = useNoiseAnalysisAvailable(testVariation?.projectId);

  useEffect(() => {
    if (testVariationId) {
      testVariationService
        .getDetails(testVariationId)
        .then((item) => {
          setTestVariation(item);
        })
        .catch((err: string) =>
          enqueueSnackbar(err, {
            variant: "error",
          }),
        );
    }
  }, [testVariationId, enqueueSnackbar]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {testVariation && (
        <>
          <TestVariationDetails testVariation={testVariation} />
          <Typography
            variant="subtitle1"
            component="h2"
            sx={{ mt: 4, mb: 1.5 }}
          >
            Baseline history
            <Typography
              component="span"
              variant="body2"
              sx={{ color: "text.secondary", ml: 1 }}
            >
              {testVariation.baselines.length}
            </Typography>
          </Typography>
          <Stack spacing={2}>
            {testVariation.baselines.map((baseline: Baseline) => (
              <Card key={baseline.id}>
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1.5,
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={!baseline.testRun}
                    onClick={() => {
                      const { testRun } = baseline;
                      if (testRun) {
                        navigate({
                          pathname: buildProjectPageUrl(
                            testVariation.projectId,
                          ),
                          ...buildTestRunLocation(testRun.buildId, testRun.id),
                        });
                      }
                    }}
                  >
                    Test Run
                  </Button>
                  {baseline.testRun && (
                    <>
                      <StatusChip status={baseline.testRun.status} />
                      {noiseAvailable && (
                        <NoiseHintChip run={baseline.testRun} />
                      )}
                    </>
                  )}
                  {baseline.user && (
                    <Typography variant="body2">
                      {`${baseline.user.firstName} ${baseline.user.lastName} <${baseline.user.email}>`}
                    </Typography>
                  )}
                  <Box sx={{ flex: 1 }} />
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    <DateLabel date={baseline.createdAt} />
                  </Typography>
                </Stack>
                <CardMedia
                  component="img"
                  sx={{
                    height: 480,
                    objectFit: "contain",
                    bgcolor: imageSurface.canvas,
                    borderTop: 1,
                    borderColor: "divider",
                  }}
                  image={staticService.getImage(baseline.baselineName)}
                />
              </Card>
            ))}
          </Stack>
        </>
      )}
    </Container>
  );
};

export default TestVariationDetailsPage;
