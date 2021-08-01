import { TestRun } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/env.config";
import { UpdateIgnoreAreaDto } from "../types/ignoreArea";

const ENDPOINT_URL = "/test-runs";

async function getList(buildId: string): Promise<TestRun[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}?buildId=${buildId}`,
    requestOptions
  ).then(handleResponse);
}

async function removeBulk(ids: (string | number)[]): Promise<void> {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(ids),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/delete`, requestOptions).then(
    handleResponse
  );
}

async function rejectBulk(ids: (string | number)[]): Promise<void> {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(ids),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/reject`, requestOptions).then(
    handleResponse
  );
}

async function approveBulk(
  ids: (string | number)[],
  merge: boolean
): Promise<void> {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(ids),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/approve?merge=${merge}`,
    requestOptions
  ).then(handleResponse);
}

async function updateIgnoreAreas(data: UpdateIgnoreAreaDto): Promise<void> {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/ignoreAreas/update`,
    requestOptions
  ).then(handleResponse);
}

async function addIgnoreAreas(data: UpdateIgnoreAreaDto): Promise<void> {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/ignoreAreas/add`,
    requestOptions
  ).then(handleResponse);
}

async function update(id: string, data: { comment: string }): Promise<TestRun> {
  const requestOptions = {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/update/${id}`, requestOptions).then(
    handleResponse
  );
}

export const testRunService = {
  getList,
  removeBulk,
  rejectBulk,
  approveBulk,
  updateIgnoreAreas,
  addIgnoreAreas,
  update,
};
