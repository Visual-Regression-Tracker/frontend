import { run } from "../_helpers/testRun.fixture";
import { TestStatus } from "../types";

export const A_EN = run({
  id: "a-en",
  name: "Screen A",
  customTags: "en",
  imageName: "a-en.png",
  diffName: "a-en-diff.png",
});
export const A_DE = run({
  id: "a-de",
  name: "Screen A",
  customTags: "de",
  status: TestStatus.approved,
});
export const B_EN = run({ id: "b-en", name: "Screen B", customTags: "en" });
