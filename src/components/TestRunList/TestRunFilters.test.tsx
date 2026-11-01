import { useState } from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../_test/render";
import { TestStatus } from "../../types";
import TestRunFilters from "./TestRunFilters";

const Harness = ({
  onNameChange,
  initialName = "",
  onStatusesChange = vi.fn(),
  onTagsChange = vi.fn(),
}: {
  onNameChange: (value: string) => void;
  initialName?: string;
  onStatusesChange?: (value: TestStatus[]) => void;
  onTagsChange?: (value: string[]) => void;
}) => {
  const [name, setName] = useState(initialName);
  const [statuses, setStatuses] = useState<TestStatus[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  return (
    <TestRunFilters
      tagOptions={["en", "de"]}
      statusOptions={[TestStatus.new, TestStatus.unresolved]}
      name={name}
      statuses={statuses}
      tags={tags}
      onNameChange={(value) => {
        onNameChange(value);
        setName(value);
      }}
      onStatusesChange={(value) => {
        onStatusesChange(value);
        setStatuses(value);
      }}
      onTagsChange={(value) => {
        onTagsChange(value);
        setTags(value);
      }}
      onReset={() => {
        setName("");
        setStatuses([]);
        setTags([]);
      }}
    />
  );
};

const nameInput = () => screen.getByTestId("testRunNameFilter");
const resetButton = () => screen.getByRole("button", { name: "Reset" });

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

  it("enables Reset only once a name has been reported", async () => {
    renderWithProviders(<Harness onNameChange={vi.fn()} />);
    expect(resetButton()).toBeDisabled();

    await user.type(nameInput(), "abc");
    expect(resetButton()).toBeDisabled();

    await elapse(400);
    expect(resetButton()).toBeEnabled();
  });

  it("shows the new value when the name is reset from outside", async () => {
    renderWithProviders(<Harness onNameChange={vi.fn()} />);
    await user.type(nameInput(), "abc{Enter}");
    expect(nameInput()).toHaveValue("abc");

    await user.click(resetButton());

    expect(nameInput()).toHaveValue("");
    expect(resetButton()).toBeDisabled();
  });

  it("can be typed into again after a reset", async () => {
    const onNameChange = vi.fn();
    renderWithProviders(<Harness onNameChange={onNameChange} />);
    await user.type(nameInput(), "abc{Enter}");
    await user.click(resetButton());
    onNameChange.mockClear();

    await user.type(nameInput(), "xyz");
    await elapse(400);

    expect(nameInput()).toHaveValue("xyz");
    expect(onNameChange).toHaveBeenCalledWith("xyz");
  });
});

describe("TestRunFilters status and tag filters", () => {
  it("reports the chosen statuses", async () => {
    const onStatusesChange = vi.fn();
    const { user } = renderWithProviders(
      <Harness onNameChange={vi.fn()} onStatusesChange={onStatusesChange} />,
    );

    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(screen.getByRole("option", { name: TestStatus.new }));

    expect(onStatusesChange).toHaveBeenCalledWith([TestStatus.new]);
  });

  it("reports the chosen tags", async () => {
    const onTagsChange = vi.fn();
    const { user } = renderWithProviders(
      <Harness onNameChange={vi.fn()} onTagsChange={onTagsChange} />,
    );

    await user.click(screen.getByRole("combobox", { name: "Tag" }));
    await user.click(screen.getByRole("option", { name: "de" }));

    expect(onTagsChange).toHaveBeenCalledWith(["de"]);
  });

  it("resets every filter", async () => {
    const { user } = renderWithProviders(<Harness onNameChange={vi.fn()} />);
    await user.click(screen.getByRole("combobox", { name: "Tag" }));
    await user.click(screen.getByRole("option", { name: "de" }));
    expect(resetButton()).toBeEnabled();

    await user.click(resetButton());

    expect(resetButton()).toBeDisabled();
  });
});
