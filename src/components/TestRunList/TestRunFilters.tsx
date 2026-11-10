import type { ReactNode } from "react";
import { FilterBar } from "../FilterBar";
import { TagField } from "../../types";
import { TAG_LABELS } from "../../_helpers/testRunTags.helper";
import type { TagFilters } from "./useTestRunFilters";
import { TEST_ID } from "../../constants/locators";

const CHIP_ORDER: TagField[] = [
  "os",
  "browser",
  "viewport",
  "device",
  "customTags",
];

const chipLabel = (field: TagField) =>
  field === "customTags" ? "Tags" : TAG_LABELS[field];

interface IProps {
  name: string;
  tagFilters: TagFilters;
  tagOptions: Record<TagField, string[]>;
  hasActiveFilters: boolean;
  actions?: ReactNode;
  onNameChange: (value: string) => void;
  onTagFilterChange: (field: TagField, values: string[]) => void;
  onReset: () => void;
}

const TestRunFilters = ({
  name,
  tagFilters,
  tagOptions,
  hasActiveFilters,
  actions,
  onNameChange,
  onTagFilterChange,
  onReset,
}: IProps) => (
  <FilterBar
    search={name}
    onSearchChange={onNameChange}
    searchLabel="Name"
    searchMinLength={2}
    searchWidth={180}
    searchTestId={TEST_ID.testRunNameFilter}
    active={hasActiveFilters}
    actions={actions}
    filters={[
      ...CHIP_ORDER.map((field) => ({
        id: field,
        label: chipLabel(field),
        options: tagOptions[field],
        value: tagFilters[field],
        onChange: (values: string[]) => onTagFilterChange(field, values),
      })),
    ]}
    onClear={onReset}
  />
);

export default TestRunFilters;
