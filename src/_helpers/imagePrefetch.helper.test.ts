import { run } from "./testRun.fixture";
import { neighbourImageNames, prefetchImages } from "./imagePrefetch.helper";
import { staticService } from "../services";

const at = (index: number) =>
  run({
    id: `run-${index}`,
    baselineName: `baseline-${index}.png`,
    imageName: `image-${index}.png`,
    diffName: `diff-${index}.png`,
  });

const list = (length: number) =>
  Array.from({ length }, (_unused, index) => at(index));

describe("neighbourImageNames", () => {
  it("asks for the run ahead before the one behind, since review moves forward", () => {
    const names = neighbourImageNames(list(5), 2);

    expect(names.indexOf("image-3.png")).toBeLessThan(
      names.indexOf("image-1.png"),
    );
  });

  it("leaves out the run being looked at — it is already loading", () => {
    const names = neighbourImageNames(list(5), 2);

    expect(names).not.toContain("image-2.png");
    expect(names).not.toContain("baseline-2.png");
    expect(names).not.toContain("diff-2.png");
  });

  it("takes all three pictures of a neighbour", () => {
    const names = neighbourImageNames(list(3), 0);

    expect(names).toEqual(
      expect.arrayContaining(["baseline-1.png", "image-1.png", "diff-1.png"]),
    );
  });

  it("stops at the start of the list", () => {
    const names = neighbourImageNames(list(5), 0);

    expect(names).not.toContain("image-4.png");
    expect(names).toContain("image-1.png");
  });

  it("stops at the end of the list", () => {
    const names = neighbourImageNames(list(3), 2);

    expect(names).toEqual(
      expect.arrayContaining(["image-1.png", "baseline-1.png"]),
    );
    expect(names).toHaveLength(3);
  });

  it("skips a run that has no diff yet", () => {
    const runs = [at(0), run({ id: "run-1", diffName: null as never })];

    expect(neighbourImageNames(runs, 0)).not.toContain(null);
  });

  it("asks for a name shared by two runs only once", () => {
    const shared = run({ id: "shared", baselineName: "same-baseline.png" });
    const runs = [at(0), { ...shared, id: "a" }, { ...shared, id: "b" }];

    const names = neighbourImageNames(runs, 0);

    expect(names.filter((name) => name === "same-baseline.png")).toHaveLength(
      1,
    );
  });

  it("has nothing to fetch when the run is not in the list", () => {
    expect(neighbourImageNames(list(3), -1)).toEqual([]);
  });
});

describe("prefetchImages", () => {
  let requestedSrcs: string[];
  let originalImage: typeof window.Image;

  beforeEach(() => {
    requestedSrcs = [];
    originalImage = window.Image;
    // jsdom will not load anything, but it does record what was asked for
    window.Image = class {
      set src(value: string) {
        requestedSrcs.push(value);
      }
    } as unknown as typeof window.Image;
  });

  afterEach(() => {
    window.Image = originalImage;
  });

  it("requests every name through the same URL the dialog will use", () => {
    prefetchImages(["a.png", "b.png"], new Set());

    expect(requestedSrcs).toEqual([
      staticService.getImage("a.png"),
      staticService.getImage("b.png"),
    ]);
  });

  it("does not ask twice for a name it already requested", () => {
    const alreadyRequested = new Set<string>();

    prefetchImages(["a.png"], alreadyRequested);
    prefetchImages(["a.png", "b.png"], alreadyRequested);

    expect(requestedSrcs).toEqual([
      staticService.getImage("a.png"),
      staticService.getImage("b.png"),
    ]);
  });
});
