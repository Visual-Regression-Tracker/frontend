import type { Locator } from "@playwright/test";

export const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`${locator.toString()} has no bounding box`);
  return box;
};
