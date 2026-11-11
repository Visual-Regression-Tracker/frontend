import { act, renderHook } from "@testing-library/react";
import { useTestRunSelection } from "./useTestRunSelection";

describe("useTestRunSelection", () => {
  it("ticks every given run, then unticks all once they are all ticked", () => {
    const { result } = renderHook(() => useTestRunSelection("build-a"));

    act(() => result.current.setSelectedIds(["a"]));
    act(() => result.current.toggleAll(["a", "b"]));

    expect(result.current.selectedIds).toEqual(["a", "b"]);

    act(() => result.current.toggleAll(["a", "b"]));

    expect(result.current.selectedIds).toEqual([]);
  });

  it("ticks one run and unticks it again, leaving the others", () => {
    const { result } = renderHook(() => useTestRunSelection("build-a"));
    act(() => result.current.setSelectedIds(["other"]));

    act(() => result.current.toggleOne("a"));

    expect(result.current.selectedIds).toEqual(["other", "a"]);

    act(() => result.current.toggleOne("a"));

    expect(result.current.selectedIds).toEqual(["other"]);
  });

  it("clears the ticks when another build is opened", () => {
    const { result, rerender } = renderHook(
      ({ buildId }) => useTestRunSelection(buildId),
      { initialProps: { buildId: "build-a" } },
    );
    act(() => result.current.setSelectedIds(["a"]));

    rerender({ buildId: "build-a" });
    expect(result.current.selectedIds).toEqual(["a"]);

    rerender({ buildId: "build-b" });
    expect(result.current.selectedIds).toEqual([]);
  });
});
