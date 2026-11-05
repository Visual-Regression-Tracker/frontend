import { statisticsService } from "./statistics.service";
import { API, AUTH, signInForEachTest, stubFetch } from "../_test/fetch.helper";

vi.mock("../_config/env.config", () => ({ API_URL: "http://api.test" }));

describe("statisticsService", () => {
  signInForEachTest();

  it("getResults asks for every branch of a project", async () => {
    const fetchMock = stubFetch([{ id: "b1" }]);

    const result = await statisticsService.getResults("p1");

    expect(result).toEqual([{ id: "b1" }]);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API}/statistics/results?projectId=p1`,
      { method: "GET", headers: AUTH },
    );
  });

  it("getResults encodes the branch name", async () => {
    const fetchMock = stubFetch([]);

    await statisticsService.getResults("p1", "feature/a b");

    expect(fetchMock).toHaveBeenCalledWith(
      `${API}/statistics/results?projectId=p1&branchName=feature%2Fa%20b`,
      { method: "GET", headers: AUTH },
    );
  });
});
