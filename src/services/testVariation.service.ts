import { TestVariation, Build } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/env.config";
import { IgnoreArea } from "../types/ignoreArea";

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

async function setIgnoreAreas(
  variationId: string,
  ignoreAreas: IgnoreArea[]
): Promise<TestVariation> {
  const requestOptions = {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(ignoreAreas),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/ignoreArea/${variationId}`,
    requestOptions
  ).then(handleResponse);
}

async function setComment(id: string, comment: string): Promise<TestVariation> {
  const requestOptions = {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ comment }),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/comment/${id}`, requestOptions).then(
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
  setIgnoreAreas,
  setComment,
  merge,
  remove,
};
