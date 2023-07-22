import { expect, test, describe } from "@jest/globals";
import { setupServer } from "msw/node";
import { rest } from "msw";

import { buildsService } from "./builds.service";
import { API_URL } from "../_config/env.config";

const getDetails = buildsService.getDetails;
const ENDPOINT_URL = "/builds";

import { TEST_BUILD_PASSED } from "../_test/test.data.helper";

// Define the MSW server with custom handlers
const server = setupServer(
  rest.get(`${API_URL}${ENDPOINT_URL}/:id`, (req, res, ctx) => {
    const { id } = req.params;
    // Pass the same id that was requested
    return res(ctx.json({ ...TEST_BUILD_PASSED, id }));
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const USER_AUTH_TOKEN = "unit-testing-in-msw";

const setUser = () => {
  const userInfo = {
    token: USER_AUTH_TOKEN,
  };
  localStorage.setItem("user", JSON.stringify(userInfo));
};

describe("buildsService", () => {
  setUser();
  describe("getDetails", () => {
    test("fetches the correct URL with the provided ID", async () => {
      const id = "build123";

      // Act
      await getDetails(id);

      // Assert
      const expectedUrl = `${API_URL}${ENDPOINT_URL}/${id}`;
      const expectedOptions = {
        method: "GET",
        headers: {
          Authorization: "Bearer " + USER_AUTH_TOKEN,
        },
      };
      expect(fetch).toHaveBeenCalledWith(expectedUrl, expectedOptions);
    });

    test("returns the data from the server response", async () => {
      const id = "build123";
      const result = await getDetails(id);

      expect(result.id).toEqual(id);
    });

    test("handles fetch error and throws an error", async () => {
      // Set up the MSW server to return an error response
      server.use(
        rest.get(`${API_URL}${ENDPOINT_URL}/build123`, (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: "Server error" }));
        }),
      );

      const id = "build123";

      // Act & Assert
      await expect(getDetails(id)).toThrow();
    });
  });
});
