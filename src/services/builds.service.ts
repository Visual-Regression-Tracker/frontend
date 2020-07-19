import { Build } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/api.config";

const ENDPOINT_URL = "/builds"

export const buildsService = {
  getList,
  remove,
};

function getList(projectId: string): Promise<Build[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}?projectId=${projectId}`, requestOptions).then(
    handleResponse
  );
}

function remove(id: string): Promise<Build> {
  const requestOptions = {
    method: "DELETE",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/${id}`, requestOptions).then(handleResponse);
}
