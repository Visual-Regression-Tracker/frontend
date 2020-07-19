import { Project } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/api.config";

export const projectsService = {
  getAll,
  remove,
  create,
  update,
};

function getAll(): Promise<Project[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}/projects`, requestOptions).then(handleResponse);
}

function remove(id: string): Promise<Project> {
  const requestOptions = {
    method: "DELETE",
    headers: authHeader(),
  };

  return fetch(`${API_URL}/projects/${id}`, requestOptions).then(
    handleResponse
  );
}

function create(project: {
  name: string;
  mainBranchName: string;
}): Promise<Project> {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(project),
  };

  return fetch(`${API_URL}/projects`, requestOptions).then(handleResponse);
}

function update(project: {
  id: string;
  name: string;
  mainBranchName: string;
}): Promise<Project> {
  const requestOptions = {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(project),
  };

  return fetch(`${API_URL}/projects`, requestOptions).then(handleResponse);
}
