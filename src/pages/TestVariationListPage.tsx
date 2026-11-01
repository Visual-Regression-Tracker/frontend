import { useEffect, useMemo, useState } from "react";
import TestVariationList from "../components/TestVariationList";
import { useNavigate, useParams } from "react-router-dom";
import { TestVariation } from "../types";
import { testVariationService } from "../services";
import {
  Box,
  Container,
  Pagination,
  Paper,
  Stack,
  TextField,
  MenuItem,
  Typography,
} from "@mui/material";
import { PageHeader } from "../components/PageHeader";
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

const TestVariationListPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const helpDispatch = useHelpDispatch();
  const { projectId = "" } = useParams<{ projectId: string }>();
  const [testVariations, setTestVariations] = useState<TestVariation[]>([]);

  const [query, setQuery] = useState("");
  const [os, setOs] = useState("");
  const [device, setDevice] = useState("");
  const [browser, setBrowser] = useState("");
  const [viewport, setViewport] = useState("");
  const [customTags, setCustomTags] = useState("");
  const [branchName, setBranchName] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  useEffect(() => {
    setHelpSteps(helpDispatch, TEST_VARIATION_LIST_PAGE);
  });

  useEffect(() => {
    setPage(1);
  }, [query, os, device, browser, viewport, customTags, branchName]);

  useEffect(() => {
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

  const filteredItems = useMemo(
    () =>
      testVariations.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) &&
          (branchName ? t.branchName === branchName : true) &&
          (os ? t.os === os : true) &&
          (device ? t.device === device : true) &&
          (viewport ? t.viewport === viewport : true) &&
          (customTags ? t.customTags === customTags : true) &&
          (browser ? t.browser === browser : true),
      ),
    [
      query,
      branchName,
      os,
      device,
      browser,
      viewport,
      customTags,
      testVariations,
    ],
  );

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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title="Variations"
        subtitle={
          filteredItems.length === testVariations.length
            ? `${testVariations.length} baselines`
            : `${filteredItems.length} of ${testVariations.length} baselines`
        }
        actions={
          <Box
            id={LOCATOR_TEST_VARIATION_LIST_PAGE_SELECT_PROJECT}
            sx={{ width: { xs: "100%", sm: 280 } }}
          >
            <ProjectSelect
              projectId={projectId}
              onProjectSelect={(id) => {
                navigate(`${routes.VARIATION_LIST_PAGE}/${id}`);
              }}
            />
          </Box>
        }
      />
      <Stack spacing={2} mb={3}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" mb={1}>
            Merge branches
          </Typography>
          <TestVariationMergeForm
            projectId={projectId}
            items={Array.from(new Set(testVariations.map((t) => t.branchName)))}
          />
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
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
        </Paper>
      </Stack>
      <TestVariationList items={paginatedItems} onDeleteClick={handleDelete} />
      {filteredItems.length > Math.min(...PAGE_SIZE_OPTIONS) && (
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}
          sx={{ pt: 3 }}
        >
          {pageCount > 1 && (
            <Pagination
              count={pageCount}
              page={currentPage}
              onChange={(_event, value) => setPage(value)}
            />
          )}
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
        </Stack>
      )}
    </Container>
  );
};

export default TestVariationListPage;
