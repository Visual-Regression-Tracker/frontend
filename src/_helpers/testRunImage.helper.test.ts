import { run } from "./testRun.fixture";
import { fakeImage } from "../_test/fakeImage";
import {
  imageFor,
  imageSizesDiffer,
  thumbnailFor,
} from "./testRunImage.helper";
import { staticService } from "../services";

describe("thumbnailFor", () => {
  it("uses the small copy of the diff", () => {
    const testRun = run({
      diffName: "diff.png",
      diffThumbnailName: "diff.thumb.png",
    });

    expect(thumbnailFor(testRun, true)).toBe(
      staticService.getImage("diff.thumb.png"),
    );
  });

  it("uses the small copy of the screenshot when the diff is hidden", () => {
    const testRun = run({
      imageName: "image.png",
      imageThumbnailName: "image.thumb.png",
    });

    expect(thumbnailFor(testRun, false)).toBe(
      staticService.getImage("image.thumb.png"),
    );
  });

  it("falls back to the full-size picture when there is no small copy", () => {
    const testRun = run({ diffName: "diff.png", diffThumbnailName: undefined });

    expect(thumbnailFor(testRun, true)).toBe(imageFor(testRun, true));
  });

  it("falls back when the run has no diff at all", () => {
    const testRun = run({
      diffName: null,
      diffThumbnailName: "stale.thumb.png",
      imageName: "image.png",
      imageThumbnailName: "image.thumb.png",
    });

    expect(thumbnailFor(testRun, true)).toBe(
      staticService.getImage("image.thumb.png"),
    );
  });
});

describe("imageSizesDiffer", () => {
  const withBoth = run({ imageName: "image.png", baselineName: "base.png" });

  it("is false for images of the same size", () => {
    expect(
      imageSizesDiffer(withBoth, fakeImage(100, 50), fakeImage(100, 50)),
    ).toBe(false);
  });

  it("is true when the height or the width differs", () => {
    expect(
      imageSizesDiffer(withBoth, fakeImage(100, 60), fakeImage(100, 50)),
    ).toBe(true);
    expect(
      imageSizesDiffer(withBoth, fakeImage(110, 50), fakeImage(100, 50)),
    ).toBe(true);
  });

  it("is true while only one of the two has loaded", () => {
    expect(imageSizesDiffer(withBoth, fakeImage(100, 50), undefined)).toBe(
      true,
    );
  });

  it("is false while neither has loaded", () => {
    expect(imageSizesDiffer(withBoth, undefined, undefined)).toBe(false);
  });

  it("is false for a run without a baseline or without an image", () => {
    const sized = [fakeImage(100, 60), fakeImage(100, 50)] as const;

    expect(
      imageSizesDiffer(run({ ...withBoth, baselineName: "" }), ...sized),
    ).toBe(false);
    expect(
      imageSizesDiffer(run({ ...withBoth, imageName: "" }), ...sized),
    ).toBe(false);
  });
});
