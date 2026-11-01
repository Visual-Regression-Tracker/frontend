import { projectsService } from "./projects.service";
import { API, AUTH, signInForEachTest, stubFetch } from "../_test/fetch.helper";
import { TEST_PROJECT } from "../_test/test.data.helper";

vi.mock("../_config/env.config", () => ({ API_URL: "http://api.test" }));

// the favourite endpoints answer 204 with no body at all
const stubNoContent = () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("projectsService", () => {
  signInForEachTest();

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

  it("getFavorites fetches the ids of the user's favourite projects", async () => {
    const fetchMock = stubFetch(["p1", "p2"]);

    const result = await projectsService.getFavorites();

    expect(result).toEqual(["p1", "p2"]);
    expect(fetchMock).toHaveBeenCalledWith(`${API}/projects/favorites`, {
      method: "GET",
      headers: AUTH,
    });
  });

  it("addFavorite puts the project among the favourites", async () => {
    const fetchMock = stubNoContent();

    await projectsService.addFavorite("p1");

    expect(fetchMock).toHaveBeenCalledWith(`${API}/projects/p1/favorite`, {
      method: "PUT",
      headers: AUTH,
    });
  });

  it("removeFavorite takes the project out of the favourites", async () => {
    const fetchMock = stubNoContent();

    await projectsService.removeFavorite("p1");

    expect(fetchMock).toHaveBeenCalledWith(`${API}/projects/p1/favorite`, {
      method: "DELETE",
      headers: AUTH,
    });
  });
});
