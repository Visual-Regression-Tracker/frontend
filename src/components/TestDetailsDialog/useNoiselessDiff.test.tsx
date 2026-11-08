import { act, renderHook, waitFor } from "@testing-library/react";
import { computeSolidMask } from "./solidMask.client";
import { useNoiselessDiff } from "./useNoiselessDiff";

vi.mock("./solidMask.client", () => ({ computeSolidMask: vi.fn() }));

const RUN = {
  baselineName: "baseline.png",
  imageName: "image.png",
  diffName: "diff.png",
  ignoreAreas: JSON.stringify([{ id: "a", x: 1, y: 2, width: 3, height: 4 }]),
  tempIgnoreAreas: JSON.stringify([
    { id: "b", x: 5, y: 6, width: 7, height: 8 },
  ]),
};
const READY = {
  mask: new Uint8Array(1),
  solidPixels: 26,
  diff: new Blob(["png"]),
};

const render = (run = RUN, active = true) =>
  renderHook(({ run, active }) => useNoiselessDiff(run, active), {
    initialProps: { run, active },
  });

const createObjectURL = vi.fn<(blob: Blob) => string>();
const revokeObjectURL = vi.fn<(url: string) => void>();

describe("useNoiselessDiff", () => {
  beforeEach(() => {
    createObjectURL.mockReturnValue("blob:noiseless");
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("computes nothing until the mode is selected", () => {
    const { result } = render(RUN, false);

    expect(result.current).toEqual({ status: "idle" });
    expect(computeSolidMask).not.toHaveBeenCalled();
  });

  it("computes from the API's download route with both kinds of ignore areas", async () => {
    vi.mocked(computeSolidMask).mockResolvedValue(READY);

    const { result } = render();

    expect(result.current).toEqual({ status: "computing" });
    await waitFor(() =>
      expect(result.current).toEqual({
        status: "ready",
        url: "blob:noiseless",
        solidPixels: 26,
      }),
    );
    expect(computeSolidMask).toHaveBeenCalledWith(
      {
        baselineUrl: expect.stringMatching(
          /\/images\/baseline\.png\/download$/,
        ) as string,
        imageUrl: expect.stringMatching(
          /\/images\/image\.png\/download$/,
        ) as string,
        ignoreAreas: [
          { id: "a", x: 1, y: 2, width: 3, height: 4 },
          { id: "b", x: 5, y: 6, width: 7, height: 8 },
        ],
      },
      expect.any(AbortSignal),
    );
    expect(createObjectURL).toHaveBeenCalledWith(READY.diff);
  });

  it("keeps the result when the mode is left and selected again", async () => {
    vi.mocked(computeSolidMask).mockResolvedValue(READY);
    const { result, rerender } = render();
    await waitFor(() => expect(result.current.status).toBe("ready"));

    rerender({ run: RUN, active: false });
    rerender({ run: RUN, active: true });

    expect(result.current.status).toBe("ready");
    expect(computeSolidMask).toHaveBeenCalledTimes(1);
  });

  it("reports why the images cannot be shown without noise", async () => {
    vi.mocked(computeSolidMask).mockResolvedValue({
      unavailable: "transparent",
    });

    const { result } = render();

    await waitFor(() =>
      expect(result.current).toEqual({
        status: "unavailable",
        reason: "transparent",
      }),
    );
  });

  it("reports a failed computation", async () => {
    vi.mocked(computeSolidMask).mockRejectedValue(new Error("offline"));

    const { result } = render();

    await waitFor(() =>
      expect(result.current).toEqual({ status: "failed", message: "offline" }),
    );
  });

  it("cancels the computation for a run no longer shown", () => {
    const signals: (AbortSignal | undefined)[] = [];
    vi.mocked(computeSolidMask).mockImplementation((_request, signal) => {
      signals.push(signal);
      return new Promise(() => {});
    });
    const { rerender } = render();

    rerender({ run: { ...RUN, imageName: "other.png" }, active: true });

    expect(signals.map((signal) => signal?.aborted)).toEqual([true, false]);
    expect(computeSolidMask).toHaveBeenCalledTimes(2);
  });

  it("ignores the error of a cancelled computation", async () => {
    vi.mocked(computeSolidMask).mockImplementation(
      (_request, signal) =>
        new Promise((_resolve, reject) =>
          signal?.addEventListener("abort", () =>
            reject(new DOMException("Superseded", "AbortError")),
          ),
        ),
    );
    const { result, rerender } = render();

    rerender({ run: RUN, active: false });
    await act(() => Promise.resolve());

    expect(result.current).toEqual({ status: "idle" });
  });

  it("frees the image when another run's result replaces it", async () => {
    createObjectURL.mockReturnValueOnce("blob:first");
    vi.mocked(computeSolidMask).mockResolvedValue(READY);
    const { result, rerender } = render();
    await waitFor(() => expect(result.current.status).toBe("ready"));

    rerender({ run: { ...RUN, imageName: "other.png" }, active: true });

    await waitFor(() =>
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:first"),
    );
    expect(revokeObjectURL).not.toHaveBeenCalledWith("blob:noiseless");
  });

  it("computes nothing without a diff", () => {
    const { result } = render({ ...RUN, diffName: null as unknown as string });

    expect(result.current).toEqual({ status: "idle" });
    expect(computeSolidMask).not.toHaveBeenCalled();
  });
});
