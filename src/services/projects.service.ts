import { Project } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/api.config";

export const projectsService = {
  getAll,
};

function getAll(): Promise<Project[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };

  return fetch(`${API_URL}/projects`, requestOptions).then(handleResponse);
}
