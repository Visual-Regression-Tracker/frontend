import { TestRun } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/api.config";
import { IgnoreArea } from "../types/ignoreArea";

export const testsService = {
  get,
  approve,
  reject,
  setIgnoreAreas,
};

function get(testId: string): Promise<TestRun> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}/test/${testId}`, requestOptions).then(
    handleResponse
  );
}

function approve(id: string): Promise<TestRun> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}/test/approve/${id}`, requestOptions).then(
    handleResponse
  );
}

function reject(id: string): Promise<TestRun> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}/test/reject/${id}`, requestOptions).then(
    handleResponse
  );
}

function setIgnoreAreas(
  variationId: string,
  ignoreAreas: IgnoreArea[]
): Promise<TestRun> {
  const requestOptions = {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(ignoreAreas),
  };

  return fetch(`${API_URL}/test/ignoreArea/${variationId}`, requestOptions).then(
    handleResponse
  );
}
