import { ollamaService } from "./ollama.service";
import { API, stubFetch } from "../_test/fetch.helper";

vi.mock("../_config/env.config", () => ({ API_URL: "http://api.test" }));

describe("ollamaService", () => {
  beforeEach(() => {
    localStorage.setItem("user", JSON.stringify({ token: "token-1" }));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  describe("listModels", () => {
    it("fetches the models and answers just their list", async () => {
      const models = [{ name: "llava" }];
      const fetchMock = stubFetch({ models });

      const result = await ollamaService.listModels();

      expect(result).toEqual(models);
      expect(fetchMock).toHaveBeenCalledWith(`${API}/ollama/models`, {
        method: "GET",
        headers: { Authorization: "Bearer token-1" },
      });
    });

    it("rejects with the API message when the request fails", async () => {
      stubFetch({ message: "Ollama is down" }, { status: 502 });

      await expect(ollamaService.listModels()).rejects.toBe("Ollama is down");
    });
  });
});
