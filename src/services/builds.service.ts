import { Build } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/api.config";

export const buildsService = {
  getDetails,
  getAll,
};

function getAll(projectId: string): Promise<Build[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };

  return fetch(`${API_URL}/builds/${projectId}`, requestOptions).then(handleResponse);
}

function getDetails(id: string): Promise<Build> {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };

  return fetch(`${API_URL}/builds/${id}`, requestOptions).then(handleResponse);
}