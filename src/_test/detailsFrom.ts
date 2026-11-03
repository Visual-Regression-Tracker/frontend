import type { TestRun } from "../types";

export const detailsFrom =
  (runs: TestRun[]) =>
  (id: string): Promise<TestRun> => {
    const found = runs.find((item) => item.id === id);
    return found
      ? Promise.resolve(found)
      : Promise.reject(new Error(`no run ${id}`));
  };
