import React from "react";
import TestVariationList from "../components/TestVariationList";
import { useHistory, useParams } from "react-router-dom";
import { TestVariation } from "../types";
import { testVariationService } from "../services";
import { Box, Grid } from "@material-ui/core";
import ProjectSelect from "../components/ProjectSelect";
import Filters from "../components/Filters";
import { TestVariationMergeForm } from "../components/TestVariationMergeForm";
import { useSnackbar } from "notistack";

const TestVariationListPage: React.FunctionComponent = (props: any) => {
  const history = useHistory();
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
  const [customTags, setCustomTags] = React.useState("");
  const [branchName, setBranchName] = React.useState("");
  const [filteredItems, setFilteredItems] = React.useState<TestVariation[]>([]);

  const helpSteps = [{
    target: "#select-project",
    title: 'Shows all the  historical record of baselines by Name + Branch + OS + Browser + Viewport + Device',
    content: (<div>Select the project you want to act on.</div>),
  }, {
    target: "#select-branch",
    content: (<div>Select the branch to which you want to merge the variations.</div>),
  }, {
    target: "#reset-filter",
    content: (<div>Only filters items are merged to the target branch.</div>),
  }];

  const { populateHelpSteps } = props;

  React.useEffect(() => {
    if (projectId) {
      populateHelpSteps(helpSteps);
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
  }, [projectId, enqueueSnackbar, populateHelpSteps]);

  React.useEffect(() => {
    setFilteredItems(
      testVariations.filter(
        (t) =>
          t.name.includes(query) && // by query
          (branchName ? t.branchName === branchName : true) && // by branchName
          (os ? t.os === os : true) && // by OS
          (device ? t.device === device : true) && // by device
          (viewport ? t.viewport === viewport : true) && // by viewport
          (customTags ? t.customTags === customTags : true) && // by customTags
          (browser ? t.browser === browser : true) // by browser
      )
    );
  }, [query, branchName, os, device, browser, viewport, customTags, testVariations]);

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
      <Box m={2}>
        <Grid container direction="column" spacing={2}>
          <Grid item id="select-project">
            <ProjectSelect
              projectId={projectId}
              onProjectSelect={(id) => history.push(id)}
            />
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
              customTagsState={[customTags, setCustomTags]}
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
    </React.Fragment>
  );
};

export default TestVariationListPage;
