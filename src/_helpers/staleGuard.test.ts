import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { staleGuard, useRequestGuard } from "./staleGuard";

describe("staleGuard", () => {
  it("is current until cancelled", () => {
    const guard = staleGuard();
    expect(guard.isCurrent()).toBe(true);
    guard.cancel();
    expect(guard.isCurrent()).toBe(false);
  });
});

describe("useRequestGuard", () => {
  it("lets only the latest request land", () => {
    const { result } = renderHook(() => useRequestGuard());
    const first = result.current.start();
    const second = result.current.start();
    expect(first()).toBe(false);
    expect(second()).toBe(true);
  });

  it("invalidates a request in flight", () => {
    const { result } = renderHook(() => useRequestGuard());
    const request = result.current.start();
    result.current.invalidate();
    expect(request()).toBe(false);
  });

  it("keeps one guard across renders", () => {
    const { result, rerender } = renderHook(() => useRequestGuard());
    const before = result.current;
    rerender();
    expect(result.current).toBe(before);
  });
});
