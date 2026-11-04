import { computeSolidMask } from "./solidMask.client";

const request = { baselineUrl: "/b.png", imageUrl: "/i.png" };

const workers: FakeWorker[] = [];
const latest = () => workers[workers.length - 1];

class FakeWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: { message: string }) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor(
    readonly url: URL,
    readonly options: WorkerOptions,
  ) {
    workers.push(this);
  }
}

describe("computeSolidMask", () => {
  beforeEach(() => vi.stubGlobal("Worker", FakeWorker));
  afterEach(() => vi.unstubAllGlobals());

  it("sends the request to a module worker and resolves with its answer", async () => {
    const answer = { unavailable: "transparent" };
    const result = computeSolidMask(request);
    const worker = latest();
    worker.onmessage?.({ data: answer });

    await expect(result).resolves.toBe(answer);
    expect(worker.options).toEqual({ type: "module" });
    expect(worker.url.pathname).toMatch(/solidMask\.worker\.ts$/);
    expect(worker.postMessage).toHaveBeenCalledWith(request);
    expect(worker.terminate).toHaveBeenCalled();
  });

  it("rejects with the error the worker reports", async () => {
    const result = computeSolidMask(request);
    const worker = latest();
    worker.onmessage?.({ data: { error: "Cannot load /b.png: 404" } });

    await expect(result).rejects.toThrow("Cannot load /b.png: 404");
    expect(worker.terminate).toHaveBeenCalled();
  });

  it("rejects when the worker itself fails", async () => {
    const result = computeSolidMask(request);
    const worker = latest();
    worker.onerror?.({ message: "boom" });

    await expect(result).rejects.toThrow("boom");
  });
});
