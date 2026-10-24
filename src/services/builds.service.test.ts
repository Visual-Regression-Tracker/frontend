import { buildsService } from "./builds.service";
import { API, stubFetch } from "../_test/fetch.helper";
import { BuildDto } from "../types/dto/build.dto";

vi.mock("../_config/env.config", () => ({ API_URL: "http://api.test" }));

const AUTH = { Authorization: "Bearer token-1" };

describe("buildsService", () => {
  beforeEach(() => {
    localStorage.setItem("user", JSON.stringify({ token: "token-1" }));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  describe("getList", () => {
    it("asks for one page of the project's builds", async () => {
      const fetchMock = stubFetch({ data: [] });

      const result = await buildsService.getList("p1", 10, 20);

      expect(result).toEqual({ data: [] });
      expect(fetchMock).toHaveBeenCalledWith(
        `${API}/builds?projectId=p1&take=10&skip=20`,
        { method: "GET", headers: AUTH },
      );
    });

    it("sends the CI build id search encoded in the query", async () => {
      const fetchMock = stubFetch({});

      await buildsService.getList("p1", 10, 0, "a b&c=d/é");

      expect(fetchMock.mock.calls[0][0]).toBe(
        `${API}/builds?projectId=p1&take=10&skip=0&ciBuildId=a%20b%26c%3Dd%2F%C3%A9`,
      );
    });

    it("asks for the page around a build, encoded in the query", async () => {
      const fetchMock = stubFetch({});

      await buildsService.getList("p1", 10, 0, undefined, "id/1 2");

      expect(fetchMock.mock.calls[0][0]).toBe(
        `${API}/builds?projectId=p1&take=10&skip=0&aroundBuildId=id%2F1%202`,
      );
    });

    it("sends both the search and the build to look around", async () => {
      const fetchMock = stubFetch({});

      await buildsService.getList("p1", 5, 5, "ci", "b1");

      expect(fetchMock.mock.calls[0][0]).toBe(
        `${API}/builds?projectId=p1&take=5&skip=5&ciBuildId=ci&aroundBuildId=b1`,
      );
    });

    it("leaves empty search values out of the query", async () => {
      const fetchMock = stubFetch({});

      await buildsService.getList("p1", 10, 0, "", "");

      expect(fetchMock.mock.calls[0][0]).toBe(
        `${API}/builds?projectId=p1&take=10&skip=0`,
      );
    });

    // NOTE: authHeader answers [] (not {}) when logged out, and it is passed as is
    it("sends no Authorization header when nobody is logged in", async () => {
      localStorage.clear();
      const fetchMock = stubFetch({});

      await buildsService.getList("p1", 10, 0);

      expect(fetchMock.mock.calls[0][1]).toEqual({
        method: "GET",
        headers: [],
      });
    });

    it("rejects with the API message when the request fails", async () => {
      stubFetch({ message: "Bad project" }, { status: 400 });

      await expect(buildsService.getList("p1", 10, 0)).rejects.toBe(
        "Bad project",
      );
    });
  });

  it("getDetails fetches one build by id", async () => {
    const fetchMock = stubFetch({ id: "b1" });

    const result = await buildsService.getDetails("b1");

    expect(result).toEqual({ id: "b1" });
    expect(fetchMock).toHaveBeenCalledWith(`${API}/builds/b1`, {
      method: "GET",
      headers: AUTH,
    });
  });

  it("remove deletes a build by id", async () => {
    const fetchMock = stubFetch({ id: "b1" });

    const result = await buildsService.remove("b1");

    expect(result).toEqual({ id: "b1" });
    expect(fetchMock).toHaveBeenCalledWith(`${API}/builds/b1`, {
      method: "DELETE",
      headers: AUTH,
    });
  });

  it("update patches a build with the JSON body", async () => {
    const fetchMock = stubFetch({ id: "b1" });
    const body = { ciBuildId: "ci-9" } as unknown as BuildDto;

    await buildsService.update("b1", body);

    expect(fetchMock).toHaveBeenCalledWith(`${API}/builds/b1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...AUTH },
      body: JSON.stringify(body),
    });
  });

  describe("approve", () => {
    it.each([true, false])(
      "patches the approve route with merge=%s in the query",
      async (merge) => {
        const fetchMock = stubFetch({});

        await buildsService.approve("b1", merge);

        expect(fetchMock).toHaveBeenCalledWith(
          `${API}/builds/b1/approve?merge=${merge}`,
          { method: "PATCH", headers: AUTH },
        );
      },
    );
  });
});
