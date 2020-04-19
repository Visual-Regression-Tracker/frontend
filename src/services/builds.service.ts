import { Build } from "../types";
import { API_URL, handleResponse, authHeader } from "../_helpers/service.helpers";

export const buildsService = {
  getAll,
};

function getAll(projectId: number): Promise<Build[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };

  return fetch(`${API_URL}/builds/${projectId}`, requestOptions).then(handleResponse);
}
