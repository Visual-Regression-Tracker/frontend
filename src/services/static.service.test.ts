import type { Mock } from "vitest";
import noImage from "../static/no-image.png";
import { staticService } from "./static.service";

const { env, zip } = vi.hoisted(() => ({
  env: { staticUrl: undefined as string | undefined },
  zip: { file: vi.fn(), generateAsync: vi.fn() },
}));

vi.mock("../_config/env.config", () => ({
  API_URL: "http://api.test",
  get STATIC_URL() {
    return env.staticUrl;
  },
}));

vi.mock("jszip", () => ({
  default: function JSZip() {
    return zip;
  },
}));

describe("staticService", () => {
  beforeEach(() => {
    env.staticUrl = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getImage", () => {
    it.each([undefined, null, ""])(
      "answers the placeholder image for the name %j",
      (name) => {
        expect(staticService.getImage(name)).toBe(noImage);
      },
    );

    it("serves the image through the API when there is no static host", () => {
      expect(staticService.getImage("a.png")).toBe(
        "http://api.test/images/a.png",
      );
    });

    it("prefers the static host when one is configured", () => {
      env.staticUrl = "http://static.test";

      expect(staticService.getImage("a.png")).toBe("http://static.test/a.png");
    });
  });

  describe("downloadAsZip", () => {
    const blob = (name: string) => new Blob([name]);
    const answer = (status: number, body?: Blob) => ({
      ok: status >= 200 && status < 300,
      status,
      blob: async () => body,
    });

    // jsdom has no object URLs; the archive link's href and download name stand in for the download
    let downloads: { href: string; download: string }[];
    let createObjectURL: Mock<() => string>;

    beforeEach(() => {
      zip.file.mockReset();
      zip.generateAsync.mockReset().mockResolvedValue("zip-blob");
      createObjectURL = vi.fn(() => "blob:zip");
      URL.createObjectURL = createObjectURL;
      URL.revokeObjectURL = vi.fn();
      downloads = [];
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        function (this: HTMLAnchorElement) {
          downloads.push({ href: this.href, download: this.download });
        },
      );
    });

    it("zips every image from the download route and saves the archive", async () => {
      const a = blob("a");
      const b = blob("b");
      const fetchMock = vi
        .fn()
        .mockImplementation(async (url: string) =>
          url.includes("/a.png/") ? answer(200, a) : answer(200, b),
        );
      vi.stubGlobal("fetch", fetchMock);

      await staticService.downloadAsZip([
        { name: "a.png", filename: "first" },
        { name: "b.png", filename: "second" },
      ]);

      expect(fetchMock).toHaveBeenCalledWith(
        "http://api.test/images/a.png/download",
      );
      expect(fetchMock).toHaveBeenCalledWith(
        "http://api.test/images/b.png/download",
      );
      expect(zip.file).toHaveBeenCalledWith("first.png", a);
      expect(zip.file).toHaveBeenCalledWith("second.png", b);
      expect(zip.generateAsync).toHaveBeenCalledWith({ type: "blob" });
      expect(createObjectURL).toHaveBeenCalledWith("zip-blob");
      expect(downloads).toEqual([
        { href: "blob:zip", download: "vrt_images.zip" },
      ]);
    });

    it("keeps every image when several share a file name", async () => {
      const a = blob("a");
      const b = blob("b");
      const c = blob("c");
      const bodies: Record<string, Blob> = { a, b, c };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async (url: string) => {
          const name = url.replace("http://api.test/images/", "")[0];
          return answer(200, bodies[name]);
        }),
      );

      await staticService.downloadAsZip([
        { name: "a.png", filename: "Home" },
        { name: "b.png", filename: "Home" },
        { name: "c.png", filename: "Home" },
      ]);

      expect(zip.file).toHaveBeenCalledTimes(3);
      expect(zip.file).toHaveBeenCalledWith("Home.png", a);
      expect(zip.file).toHaveBeenCalledWith("Home (2).png", b);
      expect(zip.file).toHaveBeenCalledWith("Home (3).png", c);
    });

    it("falls back to the image URL when the download route answers 404", async () => {
      const redirected = blob("redirected");
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(answer(404))
        .mockResolvedValueOnce(answer(200, redirected));
      vi.stubGlobal("fetch", fetchMock);

      await staticService.downloadAsZip([{ name: "a.png", filename: "first" }]);

      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "http://api.test/images/a.png",
      );
      expect(zip.file).toHaveBeenCalledWith("first.png", redirected);
    });

    it("rejects without saving when the download route fails with another status", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(answer(500)));

      await expect(
        staticService.downloadAsZip([{ name: "a.png", filename: "first" }]),
      ).rejects.toThrow("Cannot download first: 500");

      expect(createObjectURL).not.toHaveBeenCalled();
      expect(downloads).toEqual([]);
    });

    it("rejects without saving when the fallback image cannot be fetched", async () => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValueOnce(answer(404))
          .mockResolvedValueOnce(answer(403)),
      );

      await expect(
        staticService.downloadAsZip([{ name: "a.png", filename: "first" }]),
      ).rejects.toThrow("Cannot download first: 403");

      expect(zip.file).not.toHaveBeenCalled();
      expect(createObjectURL).not.toHaveBeenCalled();
      expect(downloads).toEqual([]);
    });
  });
});
