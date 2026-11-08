import { orderByIds } from "../../_helpers/testRunOrder.helper";
import { TestRun } from "../../types";
import { TestStatus } from "../../types/testStatus";

// runs acted on this session, per build: go-to-next skips them before socket state catches up
const acted: { buildId: string | null; ids: Set<string> } = {
  buildId: null,
  ids: new Set(),
};
export const rememberActed = (buildId: string, ids: string[]): void => {
  if (acted.buildId !== buildId) {
    acted.buildId = buildId;
    acted.ids = new Set();
  }
  ids.forEach((id) => acted.ids.add(id));
};
export const forgetActed = (buildId: string, ids: string[]): void => {
  if (acted.buildId === buildId) {
    ids.forEach((id) => acted.ids.delete(id));
  }
};
const isActed = (buildId: string, id: string): boolean =>
  acted.buildId === buildId && acted.ids.has(id);

// wraps round the list, so the last run still finds an earlier unresolved one
export const findNextUnresolved = (
  allTestRuns: TestRun[],
  orderedIds: readonly (string | number)[] | undefined,
  current: TestRun,
): TestRun | undefined => {
  const ordered = orderByIds(allTestRuns, orderedIds);
  const currentIndex = ordered.findIndex((run) => run.id === current.id);
  const rotated = [
    ...ordered.slice(currentIndex + 1),
    ...ordered.slice(0, currentIndex + 1),
  ];
  return rotated.find(
    (run) =>
      run.status === TestStatus.unresolved && !isActed(current.buildId, run.id),
  );
};
