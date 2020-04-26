import { TestRun } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/api.config";

export const buildsService = {
  getTestRuns,
  remove,
};

function getTestRuns(id: string): Promise<TestRun[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}/builds/${id}`, requestOptions).then(handleResponse);
}

function remove(id: string): Promise<number> {
  const requestOptions = {
    method: "DELETE",
    headers: authHeader(),
  };

  return fetch(`${API_URL}/builds/${id}`, requestOptions).then(handleResponse);
}
