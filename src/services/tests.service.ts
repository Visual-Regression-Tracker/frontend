import { Test } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/api.config";
import { RectConfig } from "konva/types/shapes/Rect";

export const testsService = {
  get,
  getAll,
  approve,
  reject,
  setIgnoreAreas,
};

function getAll(buildId: string): Promise<Test[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}/tests/${buildId}`, requestOptions).then(
    handleResponse
  );
}

function get(testId: string): Promise<Test> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}/tests/${testId}`, requestOptions).then(
    handleResponse
  );
}

function approve(id: string): Promise<Test> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}/tests/approve/${id}`, requestOptions).then(
    handleResponse
  );
}

function reject(id: string): Promise<Test> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}/tests/reject/${id}`, requestOptions).then(
    handleResponse
  );
}

function setIgnoreAreas(
  testId: string,
  ignoreAreas: RectConfig[]
): Promise<Test> {
  const requestOptions = {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ testId, ignoreAreas }),
  };

  return fetch(`${API_URL}/tests`, requestOptions).then(handleResponse);
}
