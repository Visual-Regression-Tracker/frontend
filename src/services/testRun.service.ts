import { TestRun } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/api.config";
import { IgnoreArea } from "../types/ignoreArea";

const ENDPOINT_URL = "/test-runs"

export const testRunService = {
  setIgnoreAreas
};

function setIgnoreAreas(
  id: string,
  ignoreAreas: IgnoreArea[]
): Promise<TestRun> {
  const requestOptions = {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(ignoreAreas),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/ignoreArea/${id}`,
    requestOptions
  ).then(handleResponse);
}