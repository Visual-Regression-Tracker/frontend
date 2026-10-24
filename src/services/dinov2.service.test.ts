import { dinov2Service } from "./dinov2.service";
import { API, stubFetch } from "../_test/fetch.helper";

vi.mock("../_config/env.config", () => ({ API_URL: "http://api.test" }));

describe("dinov2Service", () => {
  beforeEach(() => {
    localStorage.setItem("user", JSON.stringify({ token: "token-1" }));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  describe("getStatus", () => {
    it("fetches whether the service is set up and answering", async () => {
      const fetchMock = stubFetch({ configured: true, available: false });

      const result = await dinov2Service.getStatus();

      expect(result).toEqual({ configured: true, available: false });
      expect(fetchMock).toHaveBeenCalledWith(`${API}/dinov2/status`, {
        method: "GET",
        headers: { Authorization: "Bearer token-1" },
      });
    });

    it("rejects with the API message when the request fails", async () => {
      stubFetch({ message: "Forbidden resource" }, { status: 403 });

      await expect(dinov2Service.getStatus()).rejects.toBe(
        "Forbidden resource",
      );
    });
  });
});
