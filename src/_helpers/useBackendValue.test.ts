import { renderHook, waitFor } from "@testing-library/react";
import { useBackendValue } from "./useBackendValue";

describe("useBackendValue", () => {
  it("has no answer until the flag is loaded, then gives it", async () => {
    const load = vi.fn().mockResolvedValue(false);

    const { result } = renderHook(() => useBackendValue(load, true));

    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBe(false));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("gives the fallback when loading fails", async () => {
    const load = vi.fn().mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useBackendValue(load, true));

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("loads once although each render passes a new fallback", async () => {
    const load = vi.fn().mockResolvedValue({ enabled: true });

    const { result, rerender } = renderHook(() =>
      useBackendValue(load, { enabled: false }),
    );
    await waitFor(() => expect(result.current).toEqual({ enabled: true }));
    rerender();

    expect(load).toHaveBeenCalledTimes(1);
  });
});
