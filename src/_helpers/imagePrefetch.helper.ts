import { TestRun } from "../types";
import { staticService } from "../services";

// How far around the reviewed run the dialog warms the browser cache. Review
// moves forward, so it reaches further ahead than behind; each run costs three
// requests, which is why the window is small.
export const PREFETCH_AHEAD = 2;
export const PREFETCH_BEHIND = 1;

/**
 * The pictures of the runs on either side of the one being reviewed, nearest
 * first and ahead before behind, so the run the arrow key lands on next is
 * requested first. Deduped, and empty names (a run compared to no baseline, or
 * not compared yet) are left out.
 */
export const neighbourImageNames = (
  testRuns: TestRun[],
  index: number,
): string[] => {
  if (index < 0 || index >= testRuns.length) {
    return [];
  }

  const offsets: number[] = [];
  for (
    let step = 1;
    step <= Math.max(PREFETCH_AHEAD, PREFETCH_BEHIND);
    step++
  ) {
    if (step <= PREFETCH_AHEAD) offsets.push(step);
    if (step <= PREFETCH_BEHIND) offsets.push(-step);
  }

  const names = new Set<string>();
  offsets.forEach((offset) => {
    const neighbour = testRuns[index + offset];
    if (!neighbour) return;
    [neighbour.baselineName, neighbour.imageName, neighbour.diffName]
      .filter((name): name is string => !!name)
      .forEach((name) => names.add(name));
  });

  return [...names];
};

/**
 * Warms the browser cache for the given image names, through the very URL the
 * dialog will ask for, so arrow navigation shows a picture instead of a
 * spinner. `alreadyRequested` is carried by the caller across renders — a
 * second request for the same name would be wasted work.
 */
export const prefetchImages = (
  names: string[],
  alreadyRequested: Set<string>,
): void => {
  names.forEach((name) => {
    if (alreadyRequested.has(name)) return;
    alreadyRequested.add(name);
    const image = new Image();
    image.src = staticService.getImage(name);
  });
};
