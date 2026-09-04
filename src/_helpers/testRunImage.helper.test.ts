import { run } from "./testRun.fixture";
import { imageFor, thumbnailFor } from "./testRunImage.helper";
import { staticService } from "../services";

describe("thumbnailFor", () => {
  // The grids draw these a hundred-odd pixels wide. Pulling the full-size file
  // for that cost ~7 MB and 68 requests every time the variations dialog opened.
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

  // runs ingested before thumbnails existed still have to draw something
  it("falls back to the full-size picture when there is no small copy", () => {
    const testRun = run({ diffName: "diff.png", diffThumbnailName: undefined });

    expect(thumbnailFor(testRun, true)).toBe(imageFor(testRun, true));
  });

  it("falls back when the run has no diff at all", () => {
    const testRun = run({
      diffName: null as never,
      diffThumbnailName: "stale.thumb.png",
      imageName: "image.png",
      imageThumbnailName: "image.thumb.png",
    });

    expect(thumbnailFor(testRun, true)).toBe(
      staticService.getImage("image.thumb.png"),
    );
  });
});
