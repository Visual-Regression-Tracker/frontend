import { expect, test, type Page } from "@playwright/test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { crc32 } from "node:zlib";
import { build } from "vite";
import type { SolidMaskRequest } from "~client/components/TestDetailsDialog/solidMask.client";
import { unpackMask } from "~client/_test/maskFixture";

const ORIGIN = "http://solid-mask.test";
const FIXTURES = resolve(
  import.meta.dirname,
  "../../src/_test/fixtures/mask-parity",
);
const CLIENT = resolve(
  import.meta.dirname,
  "../../src/components/TestDetailsDialog/solidMask.client.ts",
);
const BUNDLE_URL = "/solid-mask.js";

const referenceMask = (name: string) => {
  const { width, height } = JSON.parse(
    readFileSync(join(FIXTURES, `${name}.mask.json`), "utf8"),
  ) as { width: number; height: number };
  return unpackMask(
    readFileSync(join(FIXTURES, `${name}.mask.bin`)),
    width * height,
  );
};

const withGamma = (png: Buffer): Buffer => {
  const IHDR_END = 8 + 25;
  const body = Buffer.concat([Buffer.from("gAMA"), Buffer.alloc(4)]);
  body.writeUInt32BE(100_000, 4);
  const chunk = Buffer.alloc(body.length + 8);
  chunk.writeUInt32BE(4, 0);
  body.copy(chunk, 4);
  chunk.writeUInt32BE(crc32(body), body.length + 4);
  return Buffer.concat([
    png.subarray(0, IHDR_END),
    chunk,
    png.subarray(IHDR_END),
  ]);
};

let bundle: string;

test.beforeAll(async () => {
  bundle = mkdtempSync(join(tmpdir(), "solid-mask-"));
  await build({
    configFile: false,
    logLevel: "silent",
    build: {
      outDir: bundle,
      lib: { entry: CLIENT, formats: ["es"], fileName: "solid-mask" },
    },
  });
});

test.afterAll(() => rmSync(bundle, { recursive: true, force: true }));

test.beforeEach(async ({ context, page }) => {
  await context.route(`${ORIGIN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/") {
      return route.fulfill({
        contentType: "text/html",
        body: "<!doctype html>",
      });
    }
    const gamma = path.startsWith("/gamma/");
    const [dir, file] =
      path.startsWith("/fixtures/") || gamma
        ? [FIXTURES, path.slice(path.indexOf("/", 1) + 1)]
        : [bundle, path.slice(1)];
    const body = readFileSync(join(dir, file));
    return route.fulfill({
      body: gamma ? withGamma(body) : body,
      contentType: file.endsWith(".png") ? "image/png" : "text/javascript",
    });
  });
  await page.goto(ORIGIN);
});

const compute = (page: Page, request: SolidMaskRequest) =>
  page.evaluate(
    async ({ bundleUrl, request }) => {
      const { computeSolidMask } = (await import(
        bundleUrl
      )) as typeof import("~client/components/TestDetailsDialog/solidMask.client");
      const result = await computeSolidMask(request);
      return "mask" in result
        ? { solidPixels: result.solidPixels, mask: Array.from(result.mask) }
        : result;
    },
    { bundleUrl: BUNDLE_URL, request },
  );

for (const [title, folder] of [
  ["a real screenshot pair", "fixtures"],
  ["a pair tagged with a gamma chunk", "gamma"],
]) {
  test(`the worker gives the backend's mask for ${title}`, async ({ page }) => {
    const result = await compute(page, {
      baselineUrl: `/${folder}/login-base.png`,
      imageUrl: `/${folder}/login-image.png`,
    });

    expect("mask" in result && result.solidPixels).toBe(107);
    expect(
      "mask" in result &&
        Buffer.from(result.mask).equals(Buffer.from(referenceMask("login"))),
    ).toBe(true);
  });
}

test("the worker reports a semi-transparent image as unavailable", async ({
  page,
}) => {
  const translucentUrl = await page.evaluate(async () => {
    const canvas = new OffscreenCanvas(1280, 800);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No 2d context");
    context.fillStyle = "rgba(0, 0, 0, 0.5)";
    context.fillRect(0, 0, 1280, 800);
    return URL.createObjectURL(await canvas.convertToBlob());
  });

  const result = await compute(page, {
    baselineUrl: "/fixtures/dark-base.png",
    imageUrl: translucentUrl,
  });

  expect(result).toEqual({ unavailable: "transparent" });
});
