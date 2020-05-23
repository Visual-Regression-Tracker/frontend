import { TestRun } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/api.config";
import { IgnoreArea } from "../types/ignoreArea";

const ENDPOINT_URL = "/test-runs"

export const testRunService = {
  getList,
  remove,
  approve,
  reject,
  setIgnoreAreas,
};

function getList(buildId: string): Promise<TestRun[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}?buildId=${buildId}`, requestOptions).then(handleResponse);
}

function remove(id: string): Promise<Number> {
  const requestOptions = {
    method: "DELETE",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/${id}`, requestOptions).then(handleResponse);
}

function approve(id: string): Promise<TestRun> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/approve/${id}`, requestOptions).then(
    handleResponse
  );
}

function reject(id: string): Promise<TestRun> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/reject/${id}`, requestOptions).then(
    handleResponse
  );
}

function setIgnoreAreas(
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