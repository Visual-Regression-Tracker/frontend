import { TestVariation, Build } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/env.config";

const ENDPOINT_URL = "/test-variations";

function getList(projectId: string): Promise<TestVariation[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}?projectId=${projectId}`,
    requestOptions,
  ).then(handleResponse);
}

function getDetails(id: string): Promise<TestVariation> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/details/${id}`, requestOptions).then(
    handleResponse,
  );
}

function merge(
  projectId: string,
  fromBranch: string,
  toBranch: string,
): Promise<Build> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/merge?projectId=${projectId}&fromBranch=${fromBranch}&toBranch=${toBranch}`,
    requestOptions,
  ).then(handleResponse);
}

function remove(id: string): Promise<TestVariation> {
  const requestOptions = {
    method: "DELETE",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/${id}`, requestOptions).then(
    handleResponse,
  );
}

export const testVariationService = {
  getList,
  getDetails,
  merge,
  remove,
};
