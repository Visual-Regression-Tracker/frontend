import { projectsService } from "./projects.service";
import { API, stubFetch } from "../_test/fetch.helper";
import { TEST_PROJECT } from "../_test/test.data.helper";

vi.mock("../_config/env.config", () => ({ API_URL: "http://api.test" }));

const AUTH = { Authorization: "Bearer token-1" };

describe("projectsService", () => {
  beforeEach(() => {
    localStorage.setItem("user", JSON.stringify({ token: "token-1" }));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("getAll fetches the project list", async () => {
    const fetchMock = stubFetch([TEST_PROJECT]);

    const result = await projectsService.getAll();

    expect(result).toEqual([TEST_PROJECT]);
    expect(fetchMock).toHaveBeenCalledWith(`${API}/projects`, {
      method: "GET",
      headers: AUTH,
    });
  });

  it("remove deletes a project by id", async () => {
    const fetchMock = stubFetch(TEST_PROJECT);

    await projectsService.remove("p1");

    expect(fetchMock).toHaveBeenCalledWith(`${API}/projects/p1`, {
      method: "DELETE",
      headers: AUTH,
    });
  });

  it("create posts the project as JSON", async () => {
    const fetchMock = stubFetch(TEST_PROJECT);

    const result = await projectsService.create({ name: "New" });

    expect(result).toEqual(TEST_PROJECT);
    expect(fetchMock).toHaveBeenCalledWith(`${API}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...AUTH },
      body: JSON.stringify({ name: "New" }),
    });
  });

  it("update puts the project as JSON on the collection route", async () => {
    const fetchMock = stubFetch(TEST_PROJECT);

    await projectsService.update({ id: "p1", name: "Renamed" });

    expect(fetchMock).toHaveBeenCalledWith(`${API}/projects`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...AUTH },
      body: JSON.stringify({ id: "p1", name: "Renamed" }),
    });
  });

  it("rejects with the API message when the request fails", async () => {
    stubFetch({ message: "Forbidden" }, { status: 403 });

    await expect(projectsService.getAll()).rejects.toBe("Forbidden");
  });
});
