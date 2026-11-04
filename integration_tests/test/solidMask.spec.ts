import { expect, test, type Page } from "@playwright/test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
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

// The app does not use the worker yet, so the production bundle has no copy of it.
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
    const [dir, file] = path.startsWith("/fixtures/")
      ? [FIXTURES, path.slice("/fixtures/".length)]
      : [bundle, path.slice(1)];
    return route.fulfill({
      body: readFileSync(join(dir, file)),
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

test("the worker gives the backend's mask for a real screenshot pair", async ({
  page,
}) => {
  const result = await compute(page, {
    baselineUrl: "/fixtures/login-base.png",
    imageUrl: "/fixtures/login-image.png",
  });

  const expected = unpackMask(
    readFileSync(join(FIXTURES, "login.mask.bin")),
    1280 * 800,
  );
  expect("mask" in result && result.solidPixels).toBe(107);
  expect(
    "mask" in result && Buffer.from(result.mask).equals(Buffer.from(expected)),
  ).toBe(true);
});

test("the worker reports a semi-transparent image as unavailable", async ({
  page,
}) => {
  const translucentUrl = await page.evaluate(async () => {
    const canvas = new OffscreenCanvas(4, 4);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No 2d context");
    context.fillStyle = "rgba(0, 0, 0, 0.5)";
    context.fillRect(0, 0, 4, 4);
    return URL.createObjectURL(await canvas.convertToBlob());
  });

  const result = await compute(page, {
    baselineUrl: "/fixtures/dark-base.png",
    imageUrl: translucentUrl,
  });

  expect(result).toEqual({ unavailable: "transparent" });
});
