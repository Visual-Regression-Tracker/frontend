import { Project } from "../types";
import { API_URL, handleResponse, authHeader } from "../_helpers/service.helpers";

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
