import { readFileSync } from "node:fs";
import { join } from "node:path";
import { unpackMask } from "../_test/maskFixture";
import { readPng } from "../_test/png";
import { isOpaque, solidMask } from "./solidMask.helper";

const FIXTURES = join(__dirname, "../_test/fixtures/mask-parity");

describe("solidMask parity with the backend", () => {
  it.each([
    ["dark", 24],
    ["login", 107],
    ["noise", 26],
  ])("%s gives the backend's mask bit for bit", (name, solidPixels) => {
    const baseline = readPng(join(FIXTURES, `${name}-base.png`));
    const image = readPng(join(FIXTURES, `${name}-image.png`));
    const expected = unpackMask(
      readFileSync(join(FIXTURES, `${name}.mask.bin`)),
      baseline.width * baseline.height,
    );

    const result = solidMask(baseline, image);

    expect(isOpaque(baseline) && isOpaque(image)).toBe(true);
    expect(result?.measure.solidPixels).toBe(solidPixels);
    expect(Buffer.from(result?.mask ?? []).equals(Buffer.from(expected))).toBe(
      true,
    );
  });
});
