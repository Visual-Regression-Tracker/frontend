import { act, renderHook } from "@testing-library/react";
import { fakeImage } from "../../_test/fakeImage";
import { ImageStateLoad } from "./DrawArea";
import { useStageView } from "./useStageView";

type Loaded = [HTMLImageElement | undefined, ImageStateLoad];
interface Images {
  current: Loaded;
  baseline: Loaded;
}

const image = (width: number, height: number): Loaded => [
  fakeImage(width, height),
  "loaded",
];
const LOADING: Loaded = [undefined, "loading"];
const ORIGIN = { x: 0, y: 0 };
// each pane is 520 wide and, under its 48px toolbar, 500 high
const pane = () =>
  ({ offsetWidth: 520, offsetHeight: 548 }) as unknown as HTMLDivElement;

const renderStage = (
  initial: Images = { current: LOADING, baseline: LOADING },
) => {
  const rendered = renderHook(
    ({ current, baseline }: Images) => useStageView(current, baseline),
    { initialProps: initial },
  );
  rendered.result.current.leftItemRef.current = pane();
  rendered.result.current.rightItemRef.current = pane();
  return { ...rendered, stage: () => rendered.result.current };
};

const scaleOf = (stage: ReturnType<typeof renderStage>["stage"]) =>
  stage().stageProps.stageScaleState[0];

const zoomTo = (
  stage: ReturnType<typeof renderStage>["stage"],
  scale: number,
) => act(() => stage().stageProps.stageScaleState[1](scale));

const moveAway = (stage: ReturnType<typeof renderStage>["stage"]) => {
  act(() => {
    stage().stageProps.stagePosState[1]({ x: 30, y: 40 });
    stage().stageProps.stageOffsetState[1]({ x: 5, y: 6 });
  });
};

describe("useStageView", () => {
  it("waits for the images, then fits the larger one into its pane", () => {
    const { stage, rerender } = renderStage();
    expect(scaleOf(stage)).toBe(1);

    rerender({ current: image(1000, 300), baseline: image(500, 300) });

    expect(scaleOf(stage)).toBeCloseTo(520 / 1020);
  });

  it("keeps images that fit at their own size", () => {
    const { stage, rerender } = renderStage();

    rerender({ current: image(100, 80), baseline: image(100, 80) });

    expect(scaleOf(stage)).toBe(1);
  });

  it("does not fit while one image is still loading", () => {
    const { stage, rerender } = renderStage();

    rerender({ current: image(1000, 300), baseline: LOADING });

    expect(scaleOf(stage)).toBe(1);
  });

  it("keeps the reviewer's zoom and place for a next run of the same size", () => {
    const { stage, rerender } = renderStage();
    rerender({ current: image(1000, 300), baseline: image(1000, 300) });
    zoomTo(stage, 2);
    moveAway(stage);

    rerender({ current: image(1000, 300), baseline: image(1000, 300) });

    expect(scaleOf(stage)).toBe(2);
    expect(stage().stageProps.stagePosState[0]).toEqual({ x: 30, y: 40 });
  });

  it("fits again and goes back to the start when the size changes", () => {
    const { stage, rerender } = renderStage();
    rerender({ current: image(1000, 300), baseline: image(1000, 300) });
    zoomTo(stage, 2);
    moveAway(stage);

    rerender({ current: image(100, 2000), baseline: image(100, 2000) });

    expect(scaleOf(stage)).toBeCloseTo(500 / 2020);
    expect(stage().stageProps.stagePosState[0]).toEqual(ORIGIN);
    expect(stage().stageProps.stageOffsetState[0]).toEqual(ORIGIN);
  });

  it("shows the original size from the start", () => {
    const { stage, rerender } = renderStage();
    rerender({ current: image(1000, 300), baseline: image(1000, 300) });
    moveAway(stage);

    act(() => stage().setOriginalSize());

    expect(scaleOf(stage)).toBe(1);
    expect(stage().stageProps.stagePosState[0]).toEqual(ORIGIN);
    expect(stage().stageProps.stageOffsetState[0]).toEqual(ORIGIN);
  });

  it("fits on demand after a zoom", () => {
    const { stage, rerender } = renderStage();
    rerender({ current: image(1000, 300), baseline: image(1000, 300) });
    zoomTo(stage, 3);
    moveAway(stage);

    act(() => stage().fitImagesToStage());

    expect(scaleOf(stage)).toBeCloseTo(520 / 1020);
    expect(stage().stageProps.stagePosState[0]).toEqual(ORIGIN);
  });

  it("only goes back to the start when there is no image to fit", () => {
    const { stage } = renderStage({
      current: [undefined, "failed"],
      baseline: [undefined, "failed"],
    });
    zoomTo(stage, 3);
    moveAway(stage);

    act(() => stage().fitImagesToStage());

    expect(scaleOf(stage)).toBe(3);
    expect(stage().stageProps.stagePosState[0]).toEqual(ORIGIN);
  });
});
