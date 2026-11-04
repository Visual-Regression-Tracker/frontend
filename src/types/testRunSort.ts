export const SORT_FIELDS = ["status", "name", "tags", "noise"] as const;

// the grid sorts on its own: the table sorts by clicking its column headers
export type TestRunSortField = (typeof SORT_FIELDS)[number];

export type TestRunSort = {
  field: TestRunSortField;
  direction: "asc" | "desc";
};
