import { Build } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/env.config";

const ENDPOINT_URL = "/builds";

async function getList(projectId: string): Promise<Build[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}?projectId=${projectId}`,
    requestOptions
  ).then(handleResponse);
}

async function remove(id: string): Promise<Build> {
  const requestOptions = {
    method: "DELETE",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/${id}`, requestOptions).then(
    handleResponse
  );
}

async function stop(id: string): Promise<Build> {
  const requestOptions = {
    method: "PATCH",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/${id}`, requestOptions).then(
    handleResponse
  );
}

export const buildsService = {
  getList,
  remove,
  stop,
};
