import { TestRun } from "../types";
import { staticService } from "../services";

// Review moves forward, so reach further ahead; three requests per run keeps it small.
const PREFETCH_AHEAD = 2;
const PREFETCH_BEHIND = 1;

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

/** Warms the cache through the dialog's own URL, so arrow navigation skips the spinner. */
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
