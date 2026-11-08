import { useState } from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../_test/render";
import type { TagField } from "../../types";
import type { NoiseHintFilter } from "../../_helpers/noiseHint.helper";
import TestRunFilters from "./TestRunFilters";
import type { TagFilters } from "./useTestRunFilters";

const NO_FILTERS: TagFilters = {
  os: [],
  browser: [],
  viewport: [],
  device: [],
  customTags: [],
};

const Harness = ({
  onNameChange,
  initialName = "",
  onTagFilterChange = vi.fn(),
  onNoiseHintsChange = vi.fn(),
  offersNoiseHint = true,
}: {
  onNameChange: (value: string) => void;
  initialName?: string;
  onTagFilterChange?: (field: TagField, values: string[]) => void;
  onNoiseHintsChange?: (value: NoiseHintFilter[]) => void;
  offersNoiseHint?: boolean;
}) => {
  const [name, setName] = useState(initialName);
  const [tagFilters, setTagFilters] = useState(NO_FILTERS);
  const [noiseHints, setNoiseHints] = useState<NoiseHintFilter[]>([]);

  return (
    <TestRunFilters
      tagOptions={{
        os: ["Android", "iOS"],
        browser: ["chrome"],
        viewport: [],
        device: [],
        customTags: ["en", "de"],
      }}
      name={name}
      tagFilters={tagFilters}
      noiseHints={noiseHints}
      hasActiveFilters={
        name.length > 0 ||
        noiseHints.length > 0 ||
        Object.values(tagFilters).some((values) => values.length > 0)
      }
      onNameChange={(value) => {
        onNameChange(value);
        setName(value);
      }}
      onTagFilterChange={(field, values) => {
        onTagFilterChange(field, values);
        setTagFilters((prev) => ({ ...prev, [field]: values }));
      }}
      onNoiseHintsChange={
        offersNoiseHint
          ? (value) => {
              onNoiseHintsChange(value);
              setNoiseHints(value);
            }
          : undefined
      }
      onReset={() => {
        setName("");
        setTagFilters(NO_FILTERS);
        setNoiseHints([]);
      }}
    />
  );
};

const nameInput = () => screen.getByTestId("testRunNameFilter");
const clearButton = () =>
  screen.queryByRole("button", { name: "Clear filters" });

describe("TestRunFilters name search", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const elapse = (ms: number) =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });

  it("starts with the name it is given", () => {
    renderWithProviders(
      <Harness onNameChange={vi.fn()} initialName="checkout" />,
    );

    expect(nameInput()).toHaveValue("checkout");
  });

  it("shows what is typed at once but reports it only after the typing pauses", async () => {
    const onNameChange = vi.fn();
    renderWithProviders(<Harness onNameChange={onNameChange} />);

    await user.type(nameInput(), "abc");

    expect(nameInput()).toHaveValue("abc");
    expect(onNameChange).not.toHaveBeenCalled();

    await elapse(200);
    expect(onNameChange).not.toHaveBeenCalled();

    await elapse(150);
    expect(onNameChange).toHaveBeenCalledTimes(1);
    expect(onNameChange).toHaveBeenCalledWith("abc");
  });

  it("does not report a single character", async () => {
    const onNameChange = vi.fn();
    renderWithProviders(<Harness onNameChange={onNameChange} />);

    await user.type(nameInput(), "a");
    await elapse(1000);

    expect(nameInput()).toHaveValue("a");
    expect(onNameChange).not.toHaveBeenCalled();
  });

  it("reports the value once it reaches two characters", async () => {
    const onNameChange = vi.fn();
    renderWithProviders(<Harness onNameChange={onNameChange} />);

    await user.type(nameInput(), "a");
    await elapse(1000);
    await user.type(nameInput(), "b");
    await elapse(400);

    expect(onNameChange).toHaveBeenCalledTimes(1);
    expect(onNameChange).toHaveBeenCalledWith("ab");
  });

  it("reports an emptied input", async () => {
    const onNameChange = vi.fn();
    renderWithProviders(
      <Harness onNameChange={onNameChange} initialName="checkout" />,
    );

    await user.clear(nameInput());
    await elapse(400);

    expect(onNameChange).toHaveBeenCalledTimes(1);
    expect(onNameChange).toHaveBeenCalledWith("");
  });

  it("reports at once when Enter is pressed", async () => {
    const onNameChange = vi.fn();
    renderWithProviders(<Harness onNameChange={onNameChange} />);

    await user.type(nameInput(), "abc{Enter}");

    expect(onNameChange).toHaveBeenCalledTimes(1);
    expect(onNameChange).toHaveBeenCalledWith("abc");

    await elapse(400);
    expect(onNameChange).toHaveBeenCalledTimes(1);
  });

  it("reports at once when the input loses focus", async () => {
    const onNameChange = vi.fn();
    renderWithProviders(<Harness onNameChange={onNameChange} />);

    await user.type(nameInput(), "abc");
    await user.tab();

    expect(onNameChange).toHaveBeenCalledTimes(1);
    expect(onNameChange).toHaveBeenCalledWith("abc");

    await elapse(400);
    expect(onNameChange).toHaveBeenCalledTimes(1);
  });

  it("offers Clear filters only once a name has been reported", async () => {
    renderWithProviders(<Harness onNameChange={vi.fn()} />);
    expect(clearButton()).toBeNull();

    await user.type(nameInput(), "abc");
    expect(clearButton()).toBeNull();

    await elapse(400);
    expect(clearButton()).toBeInTheDocument();
  });

  it("shows the new value when the name is reset from outside", async () => {
    renderWithProviders(<Harness onNameChange={vi.fn()} />);
    await user.type(nameInput(), "abc{Enter}");
    expect(nameInput()).toHaveValue("abc");

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(nameInput()).toHaveValue("");
    expect(clearButton()).toBeNull();
  });

  it("can be typed into again after a reset", async () => {
    const onNameChange = vi.fn();
    renderWithProviders(<Harness onNameChange={onNameChange} />);
    await user.type(nameInput(), "abc{Enter}");
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    onNameChange.mockClear();

    await user.type(nameInput(), "xyz");
    await elapse(400);

    expect(nameInput()).toHaveValue("xyz");
    expect(onNameChange).toHaveBeenCalledWith("xyz");
  });
});

describe("TestRunFilters tag filters", () => {
  it("has one chip per tag field that has options, in the design order", () => {
    renderWithProviders(<Harness onNameChange={vi.fn()} />);

    expect(
      screen
        .getAllByRole("button", { name: /^(OS|Browser|Viewport|Device|Tags)/ })
        .map((chip) => chip.textContent),
    ).toEqual(["OS", "Browser", "Tags"]);
  });

  it("reports the picked values with their field", async () => {
    const onTagFilterChange = vi.fn();
    const { user } = renderWithProviders(
      <Harness onNameChange={vi.fn()} onTagFilterChange={onTagFilterChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Tags" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "de" }));

    expect(onTagFilterChange).toHaveBeenCalledWith("customTags", ["de"]);
  });

  it("clears every filter", async () => {
    const { user } = renderWithProviders(<Harness onNameChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "OS" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "iOS" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "OS: 1" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(screen.getByRole("button", { name: "OS" })).toBeInTheDocument();
    expect(clearButton()).toBeNull();
  });
});

describe("TestRunFilters noise filter", () => {
  const noiseChip = () => screen.queryByRole("button", { name: /^Noise/ });

  it("offers the three hints and reports the chosen one", async () => {
    const onNoiseHintsChange = vi.fn();
    const { user } = renderWithProviders(
      <Harness
        onNameChange={vi.fn()}
        onNoiseHintsChange={onNoiseHintsChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^Noise/ }));

    expect(
      screen.getAllByRole("menuitemcheckbox").map((item) => item.textContent),
    ).toEqual(["Likely noise", "Likely change", "Not analysed"]);

    await user.click(
      screen.getByRole("menuitemcheckbox", { name: "Likely change" }),
    );

    expect(onNoiseHintsChange).toHaveBeenCalledWith(["Likely change"]);
  });

  it("is hidden without a handler for it", () => {
    renderWithProviders(
      <Harness onNameChange={vi.fn()} offersNoiseHint={false} />,
    );

    expect(noiseChip()).not.toBeInTheDocument();
  });
});
