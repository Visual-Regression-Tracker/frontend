import { TestRun } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/env.config";
import { IgnoreArea } from "../types/ignoreArea";

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

async function remove(id: string): Promise<TestRun> {
  const requestOptions = {
    method: "DELETE",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/${id}`, requestOptions).then(
    handleResponse
  );
}

async function recalculateDiff(id: string): Promise<TestRun> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/recalculateDiff/${id}`,
    requestOptions
  ).then(handleResponse);
}

async function approve(id: string, merge: boolean): Promise<TestRun> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/approve?id=${id}&merge=${merge}`,
    requestOptions
  ).then(handleResponse);
}

async function reject(id: string): Promise<TestRun> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/reject/${id}`, requestOptions).then(
    handleResponse
  );
}

async function setIgnoreAreas(
  id: string,
  ignoreAreas: IgnoreArea[]
): Promise<TestRun> {
  const requestOptions = {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(ignoreAreas),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/ignoreArea/${id}`,
    requestOptions
  ).then(handleResponse);
}

async function setComment(id: string, comment: string): Promise<TestRun> {
  const requestOptions = {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ comment }),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/comment/${id}`, requestOptions).then(
    handleResponse
  );
}

export const testRunService = {
  getList,
  remove,
  recalculateDiff,
  approve,
  reject,
  setIgnoreAreas,
  setComment,
};
