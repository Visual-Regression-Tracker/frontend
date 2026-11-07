import type { ReactNode } from "react";
import { FilterBar } from "../FilterBar";
import { TagField } from "../../types";
import {
  NOISE_HINT_FILTERS,
  NoiseHintFilter,
} from "../../_helpers/noiseHint.helper";
import type { TagFilters } from "./useTestRunFilters";

const CHIP_FIELDS: { field: TagField; label: string }[] = [
  { field: "os", label: "OS" },
  { field: "browser", label: "Browser" },
  { field: "viewport", label: "Viewport" },
  { field: "device", label: "Device" },
  { field: "customTags", label: "Tags" },
];

interface IProps {
  name: string;
  tagFilters: TagFilters;
  tagOptions: Record<TagField, string[]>;
  noiseHints: NoiseHintFilter[];
  hasActiveFilters: boolean;
  actions?: ReactNode;
  onNameChange: (value: string) => void;
  onTagFilterChange: (field: TagField, values: string[]) => void;
  onNoiseHintsChange?: (value: NoiseHintFilter[]) => void;
  onReset: () => void;
}

const TestRunFilters = ({
  name,
  tagFilters,
  tagOptions,
  noiseHints,
  hasActiveFilters,
  actions,
  onNameChange,
  onTagFilterChange,
  onNoiseHintsChange,
  onReset,
}: IProps) => (
  <FilterBar
    search={name}
    onSearchChange={onNameChange}
    searchLabel="Name"
    searchMinLength={2}
    searchTestId="testRunNameFilter"
    active={hasActiveFilters}
    actions={actions}
    filters={[
      ...CHIP_FIELDS.map(({ field, label }) => ({
        id: field,
        label,
        options: tagOptions[field],
        value: tagFilters[field],
        onChange: (values: string[]) => onTagFilterChange(field, values),
      })),
      ...(onNoiseHintsChange
        ? [
            {
              id: "noise",
              label: "Noise",
              options: [...NOISE_HINT_FILTERS],
              value: noiseHints,
              onChange: (values: string[]) =>
                onNoiseHintsChange(
                  NOISE_HINT_FILTERS.filter((hint) => values.includes(hint)),
                ),
            },
          ]
        : []),
    ]}
    onClear={onReset}
  />
);

export default TestRunFilters;
