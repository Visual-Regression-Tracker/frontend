import React from "react";
import TestVariationList from "../components/TestVariationList";
import { useParams } from "react-router-dom";
import { TestVariation } from "../types";
import { testVariationService } from "../services";
import { Container, Box, Grid, Typography } from "@material-ui/core";
import ProjectSelect from "../components/ProjectSelect";
import Filters from "../components/Filters";
import { TestVariationMergeForm } from "../components/TestVariationMergeForm";
import { useSnackbar } from "notistack";

const TestVariationListPage: React.FunctionComponent = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { projectId = "" } = useParams<{ projectId: string }>();
  const [testVariations, setTestVariations] = React.useState<TestVariation[]>(
    []
  );

  // filter
  const [query, setQuery] = React.useState("");
  const [os, setOs] = React.useState("");
  const [device, setDevice] = React.useState("");
  const [browser, setBrowser] = React.useState("");
  const [viewport, setViewport] = React.useState("");
  const [branchName, setBranchName] = React.useState("");
  const [filteredItems, setFilteredItems] = React.useState<TestVariation[]>([]);

  React.useEffect(() => {
    if (projectId) {
      testVariationService
        .getList(projectId)
        .then((testVariations) => {
          setTestVariations(testVariations);
        })
        .catch((err) =>
          enqueueSnackbar(err, {
            variant: "error",
          })
        );
    }
  }, [projectId, enqueueSnackbar]);

  React.useEffect(() => {
    setFilteredItems(
      testVariations.filter(
        (t) =>
          t.name.includes(query) && // by query
          (branchName ? t.branchName === branchName : true) && // by branchName
          (os ? t.os === os : true) && // by OS
          (device ? t.device === device : true) && // by device
          (viewport ? t.viewport === viewport : true) && // by viewport
          (browser ? t.browser === browser : true) // by browser
      )
    );
  }, [query, branchName, os, device, browser, viewport, testVariations]);

  const handleDelete = (id: string) => {
    testVariationService
      .remove(id)
      .then((item) => {
        setTestVariations(testVariations.filter((i) => i.id !== item.id));
        enqueueSnackbar(`${item.name} deleted`, {
          variant: "success",
        });
      })
      .catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        })
      );
  };

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
              <TestVariationMergeForm
                projectId={projectId}
                items={Array.from(
                  new Set(testVariations.map((t) => t.branchName))
                )}
              />
            </Grid>
            <Grid item>
              <Filters
                items={testVariations}
                queryState={[query, setQuery]}
                osState={[os, setOs]}
                deviceState={[device, setDevice]}
                browserState={[browser, setBrowser]}
                viewportState={[viewport, setViewport]}
                branchNameState={[branchName, setBranchName]}
              />
            </Grid>
            <Grid item>
              <TestVariationList
                items={filteredItems}
                onDeleteClick={handleDelete}
              />
            </Grid>
          </Grid>
        </Box>
      </Container>
    </React.Fragment>
  );
};

export default TestVariationListPage;
