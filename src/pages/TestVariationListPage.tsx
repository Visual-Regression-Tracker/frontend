import { useEffect, useMemo, useState } from "react";
import TestVariationList from "../components/TestVariationList";
import { useParams } from "react-router-dom";
import { TestVariation } from "../types";
import { testVariationService } from "../services";
import {
  Box,
  Container,
  Pagination,
  Stack,
  TextField,
  MenuItem,
} from "@mui/material";
import { PageHeader } from "../components/PageHeader";
import { FilterBar } from "../components/FilterBar";
import { useSnackbar } from "notistack";
import { LOCATOR_TEST_VARIATION_FILTERS } from "../constants";

const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];

const FILTER_FIELDS = [
  { field: "os", label: "OS" },
  { field: "browser", label: "Browser" },
  { field: "viewport", label: "Viewport" },
  { field: "device", label: "Device" },
  { field: "customTags", label: "Tags" },
  { field: "branchName", label: "Branch" },
] as const;

type FilterField = (typeof FILTER_FIELDS)[number]["field"];
type Selected = Record<FilterField, string[]>;

const NOTHING_SELECTED: Selected = {
  os: [],
  browser: [],
  viewport: [],
  device: [],
  customTags: [],
  branchName: [],
};

const optionsOf = (items: TestVariation[], field: FilterField) =>
  Array.from(
    new Set(
      items
        .map((item) => item[field])
        .filter((value): value is string => !!value),
    ),
  ).sort((a, b) => a.localeCompare(b));

const TestVariationListPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { projectId = "" } = useParams<{ projectId: string }>();
  const [testVariations, setTestVariations] = useState<TestVariation[]>([]);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Selected>(NOTHING_SELECTED);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const filters = JSON.stringify([query, selected]);
  const [pagedFilters, setPagedFilters] = useState(filters);
  if (pagedFilters !== filters) {
    setPagedFilters(filters);
    setPage(1);
  }

  useEffect(() => {
    if (projectId) {
      testVariationService
        .getList(projectId)
        .then((testVariations) => {
          setTestVariations(testVariations);
        })
        .catch((err: string) =>
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
          FILTER_FIELDS.every(
            ({ field }) =>
              selected[field].length === 0 ||
              selected[field].includes(t[field] ?? ""),
          ),
      ),
    [query, selected, testVariations],
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
      .catch((err: string) =>
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
      />
      <Box id={LOCATOR_TEST_VARIATION_FILTERS} sx={{ mb: 3 }}>
        <FilterBar
          search={query}
          onSearchChange={setQuery}
          searchLabel="Name"
          filters={FILTER_FIELDS.map(({ field, label }) => ({
            id: field,
            label,
            options: optionsOf(testVariations, field),
            value: selected[field],
            onChange: (value) =>
              setSelected((current) => ({ ...current, [field]: value })),
          }))}
          onClear={() => {
            setQuery("");
            setSelected(NOTHING_SELECTED);
          }}
        />
      </Box>
      <TestVariationList items={paginatedItems} onDeleteClick={handleDelete} />
      {filteredItems.length > Math.min(...PAGE_SIZE_OPTIONS) && (
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: "center", alignItems: "center", pt: 3 }}
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
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            slotProps={{
              input: { notched: false },
              select: {
                sx: {
                  "& .MuiSelect-select": {
                    textAlign: "center",
                    pl: "32px",
                  },
                },
              },
              inputLabel: {
                shrink: true,
                sx: {
                  left: "50%",
                  transformOrigin: "top center",
                  transform: "translate(-50%, -9px) scale(0.75)",
                  px: 0.5,
                  bgcolor: "background.paper",
                },
              },
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
