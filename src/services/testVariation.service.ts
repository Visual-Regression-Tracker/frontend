import { TestVariation, Build } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/env.config";

const ENDPOINT_URL = "/test-variations";

async function getList(projectId: String): Promise<TestVariation[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}?projectId=${projectId}`,
    requestOptions
  ).then(handleResponse);
}

async function getDetails(id: String): Promise<TestVariation> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/details/${id}`, requestOptions).then(
    handleResponse
  );
}

async function merge(projectId: String, branchName: String): Promise<Build> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/merge?projectId=${projectId}&branchName=${branchName}`,
    requestOptions
  ).then(handleResponse);
}

async function remove(id: String): Promise<TestVariation> {
  const requestOptions = {
    method: "DELETE",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/${id}`, requestOptions).then(
    handleResponse
  );
}

export const testVariationService = {
  getList,
  getDetails,
  merge,
  remove,
};
