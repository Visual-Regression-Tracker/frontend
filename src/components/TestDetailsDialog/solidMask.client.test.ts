import type { computeSolidMask as Compute } from "./solidMask.client";

const request = { baselineUrl: "/b.png", imageUrl: "/i.png" };
const answer = { unavailable: "transparent" };

const workers: FakeWorker[] = [];
const latest = () => workers[workers.length - 1];

class FakeWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: { message: string }) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor(
    readonly url: URL,
    readonly options: WorkerOptions,
  ) {
    workers.push(this);
  }
}

let computeSolidMask: typeof Compute;

describe("computeSolidMask", () => {
  beforeEach(async () => {
    workers.length = 0;
    vi.stubGlobal("Worker", FakeWorker);
    vi.resetModules();
    ({ computeSolidMask } = await import("./solidMask.client"));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sends the request to a module worker and resolves with its answer", async () => {
    const result = computeSolidMask(request);
    const worker = latest();
    worker.onmessage?.({ data: answer });

    await expect(result).resolves.toBe(answer);
    expect(worker.options).toEqual({ type: "module" });
    expect(worker.url.pathname).toMatch(/solidMask\.worker\.ts$/);
    expect(worker.postMessage).toHaveBeenCalledWith(request);
    expect(worker.terminate).not.toHaveBeenCalled();
  });

  it("reuses the worker for the next request", async () => {
    const first = computeSolidMask(request);
    latest().onmessage?.({ data: answer });
    await first;

    const second = computeSolidMask(request);
    latest().onmessage?.({ data: answer });

    await expect(second).resolves.toBe(answer);
    expect(workers).toHaveLength(1);
  });

  it("stops a computation a newer request supersedes", async () => {
    const stale = computeSolidMask(request);
    const busy = latest();

    const fresh = computeSolidMask(request);
    latest().onmessage?.({ data: answer });

    await expect(stale).rejects.toMatchObject({ name: "AbortError" });
    await expect(fresh).resolves.toBe(answer);
    expect(busy.terminate).toHaveBeenCalled();
    expect(workers).toHaveLength(2);
  });

  it("stops the computation when its signal aborts", async () => {
    const controller = new AbortController();
    const result = computeSolidMask(request, controller.signal);
    controller.abort();

    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(latest().terminate).toHaveBeenCalled();
  });

  it("does not start for an already aborted signal", async () => {
    await expect(
      computeSolidMask(request, AbortSignal.abort()),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(workers).toHaveLength(0);
  });

  it("rejects with the error the worker reports and keeps the worker", async () => {
    const result = computeSolidMask(request);
    const worker = latest();
    worker.onmessage?.({ data: { error: "Cannot load /b.png: 404" } });

    await expect(result).rejects.toThrow("Cannot load /b.png: 404");
    expect(worker.terminate).not.toHaveBeenCalled();
  });

  it("replaces a worker that failed", async () => {
    const result = computeSolidMask(request);
    const failed = latest();
    failed.onerror?.({ message: "boom" });

    await expect(result).rejects.toThrow("boom");
    expect(failed.terminate).toHaveBeenCalled();

    void computeSolidMask(request);
    expect(workers).toHaveLength(2);
  });

  it("rejects when the worker's answer cannot be read", async () => {
    const result = computeSolidMask(request);
    latest().onmessageerror?.();

    await expect(result).rejects.toThrow("Cannot read the worker's answer");
  });

  it("rejects when the worker cannot be created", async () => {
    vi.stubGlobal(
      "Worker",
      class {
        constructor() {
          throw new Error("blocked by CSP");
        }
      },
    );

    await expect(computeSolidMask(request)).rejects.toThrow("blocked by CSP");
  });
});
