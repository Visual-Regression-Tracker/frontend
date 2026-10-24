import { testVariationService } from "./testVariation.service";
import { API, stubFetch } from "../_test/fetch.helper";

vi.mock("../_config/env.config", () => ({ API_URL: "http://api.test" }));

const AUTH = { Authorization: "Bearer token-1" };

describe("testVariationService", () => {
  beforeEach(() => {
    localStorage.setItem("user", JSON.stringify({ token: "token-1" }));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

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

  it("merge sends the project and both branches in the query", async () => {
    const fetchMock = stubFetch({ id: "b1" });

    const result = await testVariationService.merge("p1", "feature", "main");

    expect(result).toEqual({ id: "b1" });
    expect(fetchMock).toHaveBeenCalledWith(
      `${API}/test-variations/merge?projectId=p1&fromBranch=feature&toBranch=main`,
      { method: "GET", headers: AUTH },
    );
  });

  // NOTE: branch names are not URL-encoded, so a name with "/" or "&" is sent raw
  it("merge puts branch names into the query without encoding them", async () => {
    const fetchMock = stubFetch({});

    await testVariationService.merge("p1", "feat/a&b", "main");

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API}/test-variations/merge?projectId=p1&fromBranch=feat/a&b&toBranch=main`,
    );
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
