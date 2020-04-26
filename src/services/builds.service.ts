import { TestRun } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/api.config";

export const buildsService = {
  getTestRuns,
};

function getTestRuns(id: string): Promise<TestRun[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };

  return fetch(`${API_URL}/builds/${id}`, requestOptions).then(handleResponse);
}