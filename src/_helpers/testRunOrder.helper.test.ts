import { run } from "./testRun.fixture";
import { orderByIds } from "./testRunOrder.helper";

describe("orderByIds", () => {
  const runs = [run({ id: "a" }), run({ id: "b" }), run({ id: "c" })];

  it("keeps the runs the ids name, in their order", () => {
    expect(orderByIds(runs, ["c", "a"]).map(({ id }) => id)).toEqual([
      "c",
      "a",
    ]);
  });

  it("keeps every run without ids", () => {
    expect(orderByIds(runs, undefined)).toBe(runs);
  });
});
