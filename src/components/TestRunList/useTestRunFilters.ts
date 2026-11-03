import { useCallback, useMemo, useState } from "react";
import { TestRun, TestStatus } from "../../types";
import { statusesByAttention } from "../../_helpers/testRunStatus.helper";
import { TAG_FIELDS, tagValuesOf } from "../../_helpers/testRunTags.helper";

interface TagGroups {
  picked: Set<string>;
  // per picked tag, the fields it occurs in: a value of another picked tag there counts too
  fieldsPerTag: Array<Array<keyof TestRun>>;
}

const matchesNameQuery = (run: TestRun, query: string): boolean =>
  !query || run.name.toLowerCase().includes(query);

const matchesStatuses = (run: TestRun, statuses: TestStatus[]): boolean =>
  statuses.length === 0 || statuses.includes(run.status);

const matchesTagGroups = (
  run: TestRun,
  { picked, fieldsPerTag }: TagGroups,
): boolean =>
  fieldsPerTag.every((fields) =>
    fields.some((field) => picked.has(String(run[field] ?? ""))),
  );

export const useTestRunFilters = (testRuns: TestRun[]) => {
  const [name, setName] = useState("");
  const [statuses, setStatuses] = useState<TestStatus[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const toggleTag = useCallback(
    (tag: string) =>
      setTags((prev) =>
        prev.includes(tag)
          ? prev.filter((item) => item !== tag)
          : [...prev, tag],
      ),
    [],
  );

  const onReset = useCallback(() => {
    setName("");
    setStatuses([]);
    setTags([]);
  }, []);

  const tagFieldsByValue = useMemo(() => {
    const map = new Map<string, Array<keyof TestRun>>();
    TAG_FIELDS.forEach((field) => {
      testRuns.forEach((run) => {
        const value = run[field];
        if (typeof value !== "string" || !value) {
          return;
        }
        const fields = map.get(value);
        if (!fields) {
          map.set(value, [field]);
        } else if (!fields.includes(field)) {
          fields.push(field);
        }
      });
    });
    return map;
  }, [testRuns]);

  const query = name.trim().toLowerCase();
  const tagGroups: TagGroups = useMemo(
    () => ({
      picked: new Set(tags),
      fieldsPerTag: tags.flatMap((tag) => {
        const fields = tagFieldsByValue.get(tag);
        return fields ? [fields] : [];
      }),
    }),
    [tags, tagFieldsByValue],
  );

  const filteredRows = useMemo(
    () =>
      testRuns.filter(
        (run) =>
          matchesNameQuery(run, query) &&
          matchesStatuses(run, statuses) &&
          matchesTagGroups(run, tagGroups),
      ),
    [testRuns, query, statuses, tagGroups],
  );

  // options come from rows matching the OTHER filters: each one returns results
  const statusOptions = useMemo(() => {
    const present = new Set<TestStatus>(statuses);
    testRuns.forEach((run) => {
      if (matchesNameQuery(run, query) && matchesTagGroups(run, tagGroups)) {
        present.add(run.status);
      }
    });
    return statusesByAttention(Array.from(present));
  }, [testRuns, query, tagGroups, statuses]);

  const tagOptions = useMemo(() => {
    const present = new Set<string>(tags);
    testRuns.forEach((run) => {
      if (matchesNameQuery(run, query) && matchesStatuses(run, statuses)) {
        // read fields off the run: an array per run allocates on every keystroke
        TAG_FIELDS.forEach((field) => {
          const value = run[field];
          if (typeof value === "string" && value) {
            present.add(value);
          }
        });
      }
    });
    const fieldIndex = (value: string): number => {
      const field = tagFieldsByValue.get(value)?.[0];
      return field ? TAG_FIELDS.indexOf(field) : TAG_FIELDS.length;
    };
    return Array.from(present).sort(
      (a, b) => fieldIndex(a) - fieldIndex(b) || a.localeCompare(b),
    );
  }, [testRuns, query, statuses, tags, tagFieldsByValue]);

  // a tag or status no longer in the runs stops filtering them
  const [prunedFor, setPrunedFor] = useState(testRuns);
  if (prunedFor !== testRuns) {
    setPrunedFor(testRuns);
    if (testRuns.length > 0) {
      const existingTags = new Set<string>();
      const existingStatuses = new Set<TestStatus>();
      testRuns.forEach((run) => {
        tagValuesOf(run, TAG_FIELDS).forEach((value) =>
          existingTags.add(value),
        );
        existingStatuses.add(run.status);
      });
      setTags((prev) => {
        const next = prev.filter((tag) => existingTags.has(tag));
        return next.length === prev.length ? prev : next;
      });
      setStatuses((prev) => {
        const next = prev.filter((status) => existingStatuses.has(status));
        return next.length === prev.length ? prev : next;
      });
    }
  }

  return {
    filteredRows,
    toggleTag,
    // shaped as TestRunFilters' props, so the list spreads them onto it
    name,
    statuses,
    tags,
    statusOptions,
    tagOptions,
    onNameChange: setName,
    onStatusesChange: setStatuses,
    onTagsChange: setTags,
    onReset,
  };
};
