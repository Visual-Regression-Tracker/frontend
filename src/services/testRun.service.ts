import { TestRun } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/env.config";
import { UpdateIgnoreAreaDto } from "../types/ignoreArea";

const ENDPOINT_URL = "/test-runs";
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

function getList(buildId: string): Promise<TestRun[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}?buildId=${buildId}`,
    requestOptions
  ).then(handleResponse);
}

function getDetails(id: string): Promise<TestRun> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/${id}`, requestOptions).then(
    handleResponse
  );
}

function removeBulk(ids: string[] | number[]): Promise<void> {
  const requestOptions = {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify(ids),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/delete`, requestOptions).then(
    handleResponse
  );
}

function rejectBulk(ids: string[] | number[]): Promise<void> {
  const requestOptions = {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify(ids),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/reject`, requestOptions).then(
    handleResponse
  );
}

function approveBulk(ids: string[] | number[], merge: boolean): Promise<void> {
  const requestOptions = {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify(ids),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/approve?merge=${merge}`,
    requestOptions
  ).then(handleResponse);
}

function updateIgnoreAreas(data: UpdateIgnoreAreaDto): Promise<void> {
  const requestOptions = {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify(data),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/ignoreAreas/update`,
    requestOptions
  ).then(handleResponse);
}

function addIgnoreAreas(data: UpdateIgnoreAreaDto): Promise<void> {
  const requestOptions = {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify(data),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/ignoreAreas/add`,
    requestOptions
  ).then(handleResponse);
}

function update(
  id: string,
  data: {
    comment: string;
  }
): Promise<TestRun> {
  const requestOptions = {
    method: "PATCH",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify(data),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/update/${id}`, requestOptions).then(
    handleResponse
  );
}

export const testRunService = {
  getList,
  getDetails,
  removeBulk,
  rejectBulk,
  approveBulk,
  updateIgnoreAreas,
  addIgnoreAreas,
  update,
};
