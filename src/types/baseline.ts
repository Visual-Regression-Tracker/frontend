import { TestRun } from "./testRun";
import { User } from "./user";

export interface Baseline {
  id: string;
  baselineName: string;
  testVariationId: string;
  createdAt: string;
  updatedAt: string;
  testRun?: TestRun;
  user?: User;
}
