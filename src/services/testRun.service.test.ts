import { testRunService } from "./testRun.service";
import { API, stubFetch } from "../_test/fetch.helper";

vi.mock("../_config/env.config", () => ({ API_URL: "http://api.test" }));

const AUTH = { Authorization: "Bearer token-1" };
const JSON_AUTH = { "Content-Type": "application/json", ...AUTH };

describe("testRunService", () => {
  beforeEach(() => {
    localStorage.setItem("user", JSON.stringify({ token: "token-1" }));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("getList fetches the test runs of a build", async () => {
    const fetchMock = stubFetch([{ id: "t1" }]);

    const result = await testRunService.getList("b1");

    expect(result).toEqual([{ id: "t1" }]);
    expect(fetchMock).toHaveBeenCalledWith(`${API}/test-runs?buildId=b1`, {
      method: "GET",
      headers: AUTH,
    });
  });

  it("getDetails fetches one test run by id", async () => {
    const fetchMock = stubFetch({ id: "t1" });

    await testRunService.getDetails("t1");

    expect(fetchMock).toHaveBeenCalledWith(`${API}/test-runs/t1`, {
      method: "GET",
      headers: AUTH,
    });
  });

  it("removeBulk posts the ids to the delete route", async () => {
    const fetchMock = stubFetch({});

    await testRunService.removeBulk(["t1", "t2"]);

    expect(fetchMock).toHaveBeenCalledWith(`${API}/test-runs/delete`, {
      method: "POST",
      headers: JSON_AUTH,
      body: JSON.stringify(["t1", "t2"]),
    });
  });

  it("rejectBulk posts the ids to the reject route", async () => {
    const fetchMock = stubFetch({});

    await testRunService.rejectBulk([1, 2]);

    expect(fetchMock).toHaveBeenCalledWith(`${API}/test-runs/reject`, {
      method: "POST",
      headers: JSON_AUTH,
      body: "[1,2]",
    });
  });

  it.each([true, false])(
    "approveBulk posts the ids with merge=%s in the query",
    async (merge) => {
      const fetchMock = stubFetch({});

      await testRunService.approveBulk(["t1"], merge);

      expect(fetchMock).toHaveBeenCalledWith(
        `${API}/test-runs/approve?merge=${merge}`,
        { method: "POST", headers: JSON_AUTH, body: '["t1"]' },
      );
    },
  );

  describe("bulk results", () => {
    const bulkCalls: [string, () => Promise<unknown>][] = [
      ["removeBulk", () => testRunService.removeBulk(["t1", "t2"])],
      ["rejectBulk", () => testRunService.rejectBulk(["t1", "t2"])],
      ["approveBulk", () => testRunService.approveBulk(["t1", "t2"], false)],
    ];

    it.each(bulkCalls)(
      "%s counts every id as done when the body is empty",
      async (_name, call) => {
        vi.stubGlobal(
          "fetch",
          vi.fn().mockResolvedValue(new Response("", { status: 201 })),
        );

        expect(await call()).toEqual({
          succeeded: ["t1", "t2"],
          failed: [],
        });
      },
    );

    it.each(bulkCalls)(
      "%s returns what the server says about each id",
      async (_name, call) => {
        stubFetch({
          succeeded: ["t1"],
          failed: [{ id: "t2", message: "Not allowed" }],
        });

        expect(await call()).toEqual({
          succeeded: ["t1"],
          failed: [{ id: "t2", message: "Not allowed" }],
        });
      },
    );

    it("counts numeric ids as done by their string form", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response("", { status: 201 })),
      );

      expect(await testRunService.rejectBulk([1, 2])).toEqual({
        succeeded: ["1", "2"],
        failed: [],
      });
    });
  });

  describe("one run", () => {
    it("approveOne and rejectOne resolve when the run is not refused", async () => {
      stubFetch({ succeeded: ["t1"], failed: [] });

      await expect(testRunService.approveOne("t1", false)).resolves.toBe(
        undefined,
      );
      await expect(testRunService.rejectOne("t1")).resolves.toBe(undefined);
    });

    it("approveOne and rejectOne reject with the refusal message", async () => {
      stubFetch({
        succeeded: [],
        failed: [{ id: "t1", message: "Baseline is locked" }],
      });

      await expect(testRunService.approveOne("t1", true)).rejects.toBe(
        "Baseline is locked",
      );
      await expect(testRunService.rejectOne("t1")).rejects.toBe(
        "Baseline is locked",
      );
    });
  });

  it("getMatchingVariations fetches the siblings of a test run", async () => {
    const answer = { variations: [], skipped: [] };
    const fetchMock = stubFetch(answer);

    const result = await testRunService.getMatchingVariations("t1");

    expect(result).toEqual(answer);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API}/test-runs/matchingSiblings/t1`,
      { method: "GET", headers: AUTH },
    );
  });

  it("updateIgnoreAreas posts the areas to the update route", async () => {
    const data = {
      ids: ["t1"],
      ignoreAreas: [{ id: "a", x: 1, y: 2, width: 3, height: 4 }],
    };
    const fetchMock = stubFetch({});

    await testRunService.updateIgnoreAreas(data);

    expect(fetchMock).toHaveBeenCalledWith(
      `${API}/test-runs/ignoreAreas/update`,
      { method: "POST", headers: JSON_AUTH, body: JSON.stringify(data) },
    );
  });

  it("addIgnoreAreas posts the areas to the add route", async () => {
    const data = {
      ids: [7],
      ignoreAreas: [{ id: "a", x: 1, y: 2, width: 3, height: 4 }],
    };
    const fetchMock = stubFetch({});

    await testRunService.addIgnoreAreas(data);

    expect(fetchMock).toHaveBeenCalledWith(`${API}/test-runs/ignoreAreas/add`, {
      method: "POST",
      headers: JSON_AUTH,
      body: JSON.stringify(data),
    });
  });

  it("update patches the comment of a test run", async () => {
    const fetchMock = stubFetch({ id: "t1" });

    await testRunService.update("t1", { comment: "looks fine" });

    expect(fetchMock).toHaveBeenCalledWith(`${API}/test-runs/update/t1`, {
      method: "PATCH",
      headers: JSON_AUTH,
      body: JSON.stringify({ comment: "looks fine" }),
    });
  });

  it("rejects with the API message when the request fails", async () => {
    stubFetch({ message: "Not found" }, { status: 404 });

    await expect(testRunService.getDetails("t1")).rejects.toBe("Not found");
  });
});
