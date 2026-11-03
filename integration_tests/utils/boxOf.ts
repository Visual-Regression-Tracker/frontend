import type { Locator } from "@playwright/test";
import { defined } from "./defined";

export const boxOf = async (locator: Locator) =>
  defined(await locator.boundingBox(), `${locator.toString()} bounding box`);
