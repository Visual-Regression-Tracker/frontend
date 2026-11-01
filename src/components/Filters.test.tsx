import { useState } from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../_test/render";
import { TEST_RUN_APPROVED } from "../_test/test.data.helper";
import Filters from "./Filters";

const Harness = ({
  onQueryChange,
  initialQuery = "",
}: {
  onQueryChange: (value: string) => void;
  initialQuery?: string;
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [os, setOs] = useState("");
  const [device, setDevice] = useState("");
  const [browser, setBrowser] = useState("");
  const [viewport, setViewport] = useState("");
  const [customTags, setCustomTags] = useState("");

  return (
    <>
      <Filters
        items={[TEST_RUN_APPROVED]}
        queryState={[
          query,
          (value) => {
            const next = typeof value === "function" ? value(query) : value;
            onQueryChange(next);
            setQuery(next);
          },
        ]}
        osState={[os, setOs]}
        deviceState={[device, setDevice]}
        browserState={[browser, setBrowser]}
        viewportState={[viewport, setViewport]}
        customTagsState={[customTags, setCustomTags]}
      />
      <output data-testid="query">{query}</output>
    </>
  );
};

const nameInput = () => screen.getByRole("textbox", { name: "Name" });

describe("Filters name search", () => {
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

  it("starts with the query it is given", () => {
    renderWithProviders(
      <Harness onQueryChange={vi.fn()} initialQuery="login" />,
    );

    expect(nameInput()).toHaveValue("login");
  });

  it("shows what is typed at once but reports it only after the typing pauses", async () => {
    const onQueryChange = vi.fn();
    renderWithProviders(<Harness onQueryChange={onQueryChange} />);

    await user.type(nameInput(), "abc");

    expect(nameInput()).toHaveValue("abc");
    expect(onQueryChange).not.toHaveBeenCalled();

    await elapse(200);
    expect(onQueryChange).not.toHaveBeenCalled();

    await elapse(150);
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledWith("abc");
    expect(screen.getByTestId("query")).toHaveTextContent("abc");
  });

  it("does not report a single character", async () => {
    const onQueryChange = vi.fn();
    renderWithProviders(<Harness onQueryChange={onQueryChange} />);

    await user.type(nameInput(), "a");
    await elapse(1000);

    expect(nameInput()).toHaveValue("a");
    expect(onQueryChange).not.toHaveBeenCalled();
  });

  it("reports the value once it reaches two characters", async () => {
    const onQueryChange = vi.fn();
    renderWithProviders(<Harness onQueryChange={onQueryChange} />);

    await user.type(nameInput(), "a");
    await elapse(1000);
    await user.type(nameInput(), "b");
    await elapse(400);

    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledWith("ab");
  });

  it("reports an emptied input", async () => {
    const onQueryChange = vi.fn();
    renderWithProviders(
      <Harness onQueryChange={onQueryChange} initialQuery="login" />,
    );

    await user.clear(nameInput());
    await elapse(400);

    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledWith("");
  });

  it("reports at once when Enter is pressed", async () => {
    const onQueryChange = vi.fn();
    renderWithProviders(<Harness onQueryChange={onQueryChange} />);

    await user.type(nameInput(), "abc{Enter}");

    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledWith("abc");

    await elapse(400);
    expect(onQueryChange).toHaveBeenCalledTimes(1);
  });

  it("reports at once when the input loses focus", async () => {
    const onQueryChange = vi.fn();
    renderWithProviders(<Harness onQueryChange={onQueryChange} />);

    await user.type(nameInput(), "abc");
    await user.tab();

    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledWith("abc");

    await elapse(400);
    expect(onQueryChange).toHaveBeenCalledTimes(1);
  });

  it("shows the new value when the query is changed from outside", async () => {
    const onQueryChange = vi.fn();
    renderWithProviders(<Harness onQueryChange={onQueryChange} />);
    await user.type(nameInput(), "abc{Enter}");
    expect(nameInput()).toHaveValue("abc");

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(onQueryChange).toHaveBeenLastCalledWith("");
    expect(nameInput()).toHaveValue("");
  });

  it("can be typed into again after a reset", async () => {
    const onQueryChange = vi.fn();
    renderWithProviders(<Harness onQueryChange={onQueryChange} />);
    await user.type(nameInput(), "abc{Enter}");
    await user.click(screen.getByRole("button", { name: "Reset" }));
    onQueryChange.mockClear();

    await user.type(nameInput(), "xyz");
    await elapse(400);

    expect(nameInput()).toHaveValue("xyz");
    expect(onQueryChange).toHaveBeenCalledWith("xyz");
  });
});
