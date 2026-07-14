import React from "react";
import TestVariationList from "../components/TestVariationList";
import { useNavigate, useParams } from "react-router-dom";
import { TestVariation } from "../types";
import { testVariationService } from "../services";
import { Box, Grid, Pagination, TextField, MenuItem } from "@mui/material";
import ProjectSelect from "../components/ProjectSelect";
import Filters from "../components/Filters";
import { TestVariationMergeForm } from "../components/TestVariationMergeForm";
import { useSnackbar } from "notistack";
import { setHelpSteps, useHelpDispatch } from "../contexts/help.context";
import {
  LOCATOR_TEST_VARIATION_LIST_PAGE_SELECT_PROJECT,
  routes,
  TEST_VARIATION_LIST_PAGE,
} from "../constants";

const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];

const TestVariationListPage: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const helpDispatch = useHelpDispatch();
  const { projectId = "" } = useParams<{ projectId: string }>();
  const [testVariations, setTestVariations] = React.useState<TestVariation[]>(
    [],
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
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE_OPTIONS[0]);

  React.useEffect(() => {
    setHelpSteps(helpDispatch, TEST_VARIATION_LIST_PAGE);
  });

  React.useEffect(() => {
    setPage(1);
  }, [query, os, device, browser, viewport, customTags, branchName]);

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
          }),
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
          (customTags ? t.customTags === customTags : true) && // by customTags
          (browser ? t.browser === browser : true), // by browser
      ),
    );
  }, [
    query,
    branchName,
    os,
    device,
    browser,
    viewport,
    customTags,
    testVariations,
  ]);

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
        }),
      );
  };

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <React.Fragment>
      <Box m={2}>
        <Grid container direction="column" spacing={2}>
          <Grid item id={LOCATOR_TEST_VARIATION_LIST_PAGE_SELECT_PROJECT}>
            <ProjectSelect
              projectId={projectId}
              onProjectSelect={(id) =>
                navigate(`${routes.VARIATION_LIST_PAGE}/${id}`)
              }
            />
          </Grid>
          <Grid item>
            <TestVariationMergeForm
              projectId={projectId}
              items={Array.from(
                new Set(testVariations.map((t) => t.branchName)),
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
              items={paginatedItems}
              onDeleteClick={handleDelete}
            />
          </Grid>
          {filteredItems.length > Math.min(...PAGE_SIZE_OPTIONS) && (
            <Grid item>
              <Grid
                container
                justifyContent="center"
                alignItems="center"
                spacing={2}
                sx={{ pb: 4 }}
              >
                {pageCount > 1 && (
                  <Grid item>
                    <Pagination
                      count={pageCount}
                      page={currentPage}
                      onChange={(_event, value) => setPage(value)}
                    />
                  </Grid>
                )}
                <Grid item>
                  <TextField
                    select
                    size="small"
                    label="Per page"
                    sx={{ minWidth: 120 }}
                    SelectProps={{
                      sx: {
                        "& .MuiSelect-select": {
                          textAlign: "center",
                          pl: "32px",
                        },
                      },
                    }}
                    InputProps={{ notched: false }}
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        left: "50%",
                        transformOrigin: "top center",
                        transform: "translate(-50%, -9px) scale(0.75)",
                        px: 0.5,
                        bgcolor: "background.paper",
                      },
                    }}
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(1);
                    }}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Box>
    </React.Fragment>
  );
};

export default TestVariationListPage;
