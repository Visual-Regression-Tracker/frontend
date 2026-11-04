import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterBar } from "./FilterBar";

const Harness = ({
  onSearch = () => {},
  options = ["macOS", "Linux", "Windows"],
}: {
  onSearch?: (value: string) => void;
  options?: string[];
}) => {
  const [search, setSearch] = useState("");
  const [os, setOs] = useState<string[]>([]);
  return (
    <>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          onSearch(value);
          setSearch(value);
        }}
        filters={[
          { id: "os", label: "OS", options, value: os, onChange: setOs },
        ]}
        onClear={() => {
          setSearch("");
          setOs([]);
        }}
      />
      <output data-testid="os">{os.join(",")}</output>
    </>
  );
};

const clearButton = () =>
  screen.queryByRole("button", { name: "Clear filters" });

describe("FilterBar", () => {
  it("hides Clear filters while nothing is filtered", () => {
    render(<Harness />);

    expect(clearButton()).toBeNull();
  });

  it("selects several options of one filter", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "OS" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "macOS" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Linux" }));

    expect(screen.getByTestId("os")).toHaveTextContent("macOS,Linux");
    await user.keyboard("{Escape}");
    expect(
      await screen.findByRole("button", { name: "OS: 2" }),
    ).toBeInTheDocument();
    expect(clearButton()).toBeInTheDocument();
  });

  it("unselects an option", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "OS" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "macOS" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "macOS" }));

    expect(screen.getByTestId("os")).toBeEmptyDOMElement();
  });

  it("reports the search text", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSearch={onSearch} />);

    await user.type(
      screen.getByRole("textbox", { name: "Search" }),
      "login{Enter}",
    );

    expect(onSearch).toHaveBeenLastCalledWith("login");
    expect(clearButton()).toBeInTheDocument();
  });

  it("clears the search and the filters", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "OS" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "macOS" }));
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(screen.getByTestId("os")).toBeEmptyDOMElement();
    expect(clearButton()).toBeNull();
  });

  it("leaves out a filter without options", () => {
    render(<Harness options={[]} />);

    expect(screen.queryByRole("button", { name: "OS" })).toBeNull();
  });
});
