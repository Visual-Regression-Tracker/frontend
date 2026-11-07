import { useCallback, useMemo, useState } from "react";
import { TagField, TestRun, TestStatus } from "../../types";
import type { NoiseHint } from "../../types/noiseAnalysis";
import { NoiseHintFilter, noiseHintOf } from "../../_helpers/noiseHint.helper";
import { statusesByAttention } from "../../_helpers/testRunStatus.helper";
import { TAG_FIELDS } from "../../_helpers/testRunTags.helper";

export type TagFilters = Record<TagField, string[]>;

const EMPTY_TAG_FILTERS: TagFilters = {
  os: [],
  browser: [],
  viewport: [],
  device: [],
  customTags: [],
};

const matchesNameQuery = (run: TestRun, query: string): boolean =>
  !query || run.name.toLowerCase().includes(query);

const matchesStatuses = (run: TestRun, statuses: TestStatus[]): boolean =>
  statuses.length === 0 || statuses.includes(run.status);

const NO_HINTS: NoiseHintFilter[] = [];

const HINT_OF_FILTER: Record<
  NoiseHintFilter,
  (hint: NoiseHint | null) => boolean
> = {
  "Likely noise": (hint) => hint === "noise",
  "Likely change": (hint) => hint === "change",
  "Not analysed": (hint) => hint === null || hint === "pending",
};

const matchesNoiseHints = (
  run: TestRun,
  picked: NoiseHintFilter[],
): boolean => {
  if (picked.length === 0) {
    return true;
  }
  const hint = noiseHintOf(run);
  return picked.some((filter) => HINT_OF_FILTER[filter](hint));
};

const matchesTagFilters = (run: TestRun, tagFilters: TagFilters): boolean =>
  TAG_FIELDS.every((field) => {
    const picked = tagFilters[field];
    return picked.length === 0 || picked.includes(String(run[field] ?? ""));
  });

const hasTagFilters = (tagFilters: TagFilters): boolean =>
  TAG_FIELDS.some((field) => tagFilters[field].length > 0);

export const useTestRunFilters = (
  testRuns: TestRun[],
  noiseHintAvailable = true,
) => {
  const [name, setName] = useState("");
  const [statuses, setStatuses] = useState<TestStatus[]>([]);
  const [tagFilters, setTagFilters] = useState(EMPTY_TAG_FILTERS);
  const [pickedNoiseHints, setNoiseHints] = useState<NoiseHintFilter[]>([]);
  const noiseHints = noiseHintAvailable ? pickedNoiseHints : NO_HINTS;

  const onTagFilterChange = useCallback(
    (field: TagField, values: string[]) =>
      setTagFilters((prev) => ({ ...prev, [field]: values })),
    [],
  );

  const toggleTag = useCallback(
    (field: TagField, value: string) =>
      setTagFilters((prev) => ({
        ...prev,
        [field]: prev[field].includes(value)
          ? prev[field].filter((item) => item !== value)
          : [...prev[field], value],
      })),
    [],
  );

  const onReset = useCallback(() => {
    setName("");
    setStatuses([]);
    setTagFilters(EMPTY_TAG_FILTERS);
    setNoiseHints([]);
  }, []);

  const query = name.trim().toLowerCase();

  const filteredRows = useMemo(
    () =>
      testRuns.filter(
        (run) =>
          matchesNameQuery(run, query) &&
          matchesStatuses(run, statuses) &&
          matchesTagFilters(run, tagFilters) &&
          matchesNoiseHints(run, noiseHints),
      ),
    [testRuns, query, statuses, tagFilters, noiseHints],
  );

  // options come from rows matching the OTHER filters: each one returns results
  const statusOptions = useMemo(() => {
    const present = new Set<TestStatus>(statuses);
    testRuns.forEach((run) => {
      if (
        matchesNameQuery(run, query) &&
        matchesTagFilters(run, tagFilters) &&
        matchesNoiseHints(run, noiseHints)
      ) {
        present.add(run.status);
      }
    });
    return statusesByAttention(Array.from(present));
  }, [testRuns, query, tagFilters, noiseHints, statuses]);

  const tagOptions = useMemo(() => {
    const present = TAG_FIELDS.reduce(
      (acc, field) => ({ ...acc, [field]: new Set<string>(tagFilters[field]) }),
      {} as Record<TagField, Set<string>>,
    );
    testRuns.forEach((run) => {
      if (
        matchesNameQuery(run, query) &&
        matchesStatuses(run, statuses) &&
        matchesNoiseHints(run, noiseHints)
      ) {
        TAG_FIELDS.forEach((field) => {
          const value = run[field];
          if (typeof value === "string" && value) {
            present[field].add(value);
          }
        });
      }
    });
    return TAG_FIELDS.reduce(
      (acc, field) => ({
        ...acc,
        [field]: Array.from(present[field]).sort((a, b) => a.localeCompare(b)),
      }),
      {} as Record<TagField, string[]>,
    );
  }, [testRuns, query, statuses, noiseHints, tagFilters]);

  // a tag or status no longer in the runs stops filtering them
  const [prunedFor, setPrunedFor] = useState(testRuns);
  if (prunedFor !== testRuns) {
    setPrunedFor(testRuns);
    if (testRuns.length > 0) {
      const existingTags = Object.fromEntries(
        TAG_FIELDS.map((field) => [field, new Set<string>()]),
      ) as Record<TagField, Set<string>>;
      const existingStatuses = new Set<TestStatus>();
      testRuns.forEach((run) => {
        TAG_FIELDS.forEach((field) => {
          const value = run[field];
          if (typeof value === "string" && value) {
            existingTags[field].add(value);
          }
        });
        existingStatuses.add(run.status);
      });
      setTagFilters((prev) => {
        const next = { ...prev };
        TAG_FIELDS.forEach((field) => {
          next[field] = prev[field].filter((tag) =>
            existingTags[field].has(tag),
          );
        });
        return TAG_FIELDS.every(
          (field) => next[field].length === prev[field].length,
        )
          ? prev
          : next;
      });
      setStatuses((prev) => {
        const next = prev.filter((status) => existingStatuses.has(status));
        return next.length === prev.length ? prev : next;
      });
    }
  }

  const hasActiveFilters =
    name.length > 0 ||
    statuses.length > 0 ||
    hasTagFilters(tagFilters) ||
    noiseHints.length > 0;

  return {
    filteredRows,
    hasActiveFilters,
    toggleTag,
    // shaped as TestRunFilters' props, so the list spreads them onto it
    name,
    statuses,
    tagFilters,
    noiseHints,
    statusOptions,
    tagOptions,
    onNameChange: setName,
    onStatusesChange: setStatuses,
    onTagFilterChange,
    onNoiseHintsChange: noiseHintAvailable ? setNoiseHints : undefined,
    onReset,
  };
};
