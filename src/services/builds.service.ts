import { Build, PaginatedData } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/env.config";
import { BuildDto } from "../types/dto/build.dto";

const ENDPOINT_URL = "/builds";
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

function getList(
  projectId: string,
  take: number,
  skip: number,
): Promise<PaginatedData<Build>> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}?projectId=${projectId}&take=${take}&skip=${skip}`,
    requestOptions,
  ).then(handleResponse);
}

function getDetails(id: string): Promise<Build> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/${id}`, requestOptions).then(
    handleResponse,
  );
}

function remove(id: string): Promise<Build> {
  const requestOptions = {
    method: "DELETE",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/${id}`, requestOptions).then(
    handleResponse,
  );
}

function update(id: string, body: BuildDto): Promise<Build> {
  const requestOptions = {
    method: "PATCH",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify(body),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/${id}`, requestOptions).then(
    handleResponse,
  );
}

function approve(id: string, merge: boolean): Promise<void> {
  const requestOptions = {
    method: "PATCH",
    headers: authHeader(),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/${id}/approve?merge=${merge}`,
    requestOptions,
  ).then(handleResponse);
}

export const buildsService = {
  getDetails,
  getList,
  approve,
  remove,
  update,
};
