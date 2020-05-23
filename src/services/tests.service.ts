import { TestRun } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/api.config";

export const testsService = {
  get,
  approve,
  reject,
  remove,
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

function remove(id: string): Promise<Number> {
  const requestOptions = {
    method: "DELETE",
    headers: authHeader(),
  };

  return fetch(`${API_URL}/test/${id}`, requestOptions).then(handleResponse);
}
