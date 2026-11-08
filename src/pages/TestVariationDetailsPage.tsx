import { PageContainer } from "../components/PageContainer";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TestVariation } from "../types";
import { testVariationService, staticService } from "../services";
import { Box, Card, CardMedia, Stack, Typography } from "@mui/material";
import { imageSurface } from "../theme/tokens";
import {
  buildProjectPageUrl,
  buildTestRunLocation,
} from "../_helpers/route.helpers";
import { TestVariationDetails } from "../components/TestVariationDetails";
import { useSnackbar } from "notistack";
import {
  BaselineHistoryList,
  baselineElementId,
  versionNumber,
} from "../components/BaselineHistoryList";
import { Baseline } from "../types/baseline";
import { useNoiseAnalysisAvailable, useSetVariationCrumb } from "../contexts";

const TestVariationDetailsPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { testVariationId } = useParams<{ testVariationId: string }>();
  const [testVariation, setTestVariation] = useState<TestVariation>();
  const noiseAvailable = useNoiseAnalysisAvailable(testVariation?.projectId);
  useSetVariationCrumb(
    testVariation && {
      projectId: testVariation.projectId,
      name: testVariation.name,
    },
  );

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

  const openTestRun = ({ testRun }: Baseline) => {
    if (testVariation && testRun) {
      navigate({
        pathname: buildProjectPageUrl(testVariation.projectId),
        ...buildTestRunLocation(testRun.buildId, testRun.id),
      });
    }
  };

  const showBaseline = (baseline: Baseline) =>
    document
      .getElementById(baselineElementId(baseline))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <PageContainer>
      {testVariation && (
        <>
          <TestVariationDetails testVariation={testVariation} />
          <Box
            sx={{
              display: "grid",
              gap: 3,
              mt: 3,
              gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
              alignItems: "start",
            }}
          >
            <Box
              component="section"
              sx={{ position: { md: "sticky" }, top: { md: 16 } }}
            >
              <Typography variant="subtitle1" component="h2" sx={{ mb: 1.5 }}>
                {`Baseline history (${testVariation.baselines.length})`}
              </Typography>
              <BaselineHistoryList
                baselines={testVariation.baselines}
                noiseAvailable={noiseAvailable}
                onSelect={showBaseline}
                onOpenTestRun={openTestRun}
              />
            </Box>
            <Stack spacing={2}>
              {testVariation.baselines.map((baseline, index) => (
                <Card
                  key={baseline.id}
                  id={baselineElementId(baseline)}
                  sx={{ scrollMarginTop: 16 }}
                >
                  <Typography
                    variant="body2"
                    sx={{ px: 2, py: 1, color: "text.secondary" }}
                  >
                    {`v${versionNumber(testVariation.baselines.length, index)}`}
                  </Typography>
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
          </Box>
        </>
      )}
    </PageContainer>
  );
};

export default TestVariationDetailsPage;
