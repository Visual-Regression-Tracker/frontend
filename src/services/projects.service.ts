import { Project } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/env.config";

async function getAll(): Promise<Project[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  const response = await fetch(`${API_URL}/projects`, requestOptions);
  return handleResponse(response);
}

async function remove(id: string): Promise<Project> {
  const requestOptions = {
    method: "DELETE",
    headers: authHeader(),
  };

  const response = await fetch(`${API_URL}/projects/${id}`, requestOptions);
  return handleResponse(response);
}

async function create(project: Partial<Project>): Promise<Project> {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(project),
  };

  const response = await fetch(`${API_URL}/projects`, requestOptions);
  return handleResponse(response);
}

async function update(project: Partial<Project>): Promise<Project> {
  const requestOptions = {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(project),
  };

  const response = await fetch(`${API_URL}/projects`, requestOptions);
  return handleResponse(response);
}

export const projectsService = {
  getAll,
  remove,
  create,
  update,
};
