import { testVariationService } from "./testVariation.service";
import {
  API,
  AUTH,
  JSON_AUTH,
  signInForEachTest,
  stubFetch,
} from "../_test/fetch.helper";

vi.mock("../_config/env.config", () => ({ API_URL: "http://api.test" }));

describe("testVariationService", () => {
  signInForEachTest();

  it("getList fetches the variations of a project", async () => {
    const fetchMock = stubFetch([{ id: "v1" }]);

    const result = await testVariationService.getList("p1");

    expect(result).toEqual([{ id: "v1" }]);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API}/test-variations?projectId=p1`,
      { method: "GET", headers: AUTH },
    );
  });

  it("getDetails fetches one variation from the details route", async () => {
    const fetchMock = stubFetch({ id: "v1" });

    await testVariationService.getDetails("v1");

    expect(fetchMock).toHaveBeenCalledWith(
      `${API}/test-variations/details/v1`,
      { method: "GET", headers: AUTH },
    );
  });

  it("merge posts the project and both branches in the body", async () => {
    const fetchMock = stubFetch({ id: "b1" });

    const result = await testVariationService.merge("p1", "feat/a&b", "main");

    expect(result).toEqual({ id: "b1" });
    expect(fetchMock).toHaveBeenCalledWith(`${API}/test-variations/merge`, {
      method: "POST",
      headers: JSON_AUTH,
      body: JSON.stringify({
        projectId: "p1",
        fromBranch: "feat/a&b",
        toBranch: "main",
      }),
    });
  });

  it("remove deletes a variation by id", async () => {
    const fetchMock = stubFetch({ id: "v1" });

    await testVariationService.remove("v1");

    expect(fetchMock).toHaveBeenCalledWith(`${API}/test-variations/v1`, {
      method: "DELETE",
      headers: AUTH,
    });
  });

  it("rejects with the API message when the request fails", async () => {
    stubFetch({ message: "Conflict" }, { status: 409 });

    await expect(testVariationService.merge("p1", "a", "b")).rejects.toBe(
      "Conflict",
    );
  });
});
