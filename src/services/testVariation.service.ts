import { TestVariation } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/api.config";
import { IgnoreArea } from "../types/ignoreArea";

const ENDPOINT_URL = "/test-variations";

export const testVariationService = {
  getList,
  getDetails,
  setIgnoreAreas,
  setComment,
};

function getList(projectId: String): Promise<TestVariation[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}?projectId=${projectId}`,
    requestOptions
  ).then(handleResponse);
}

function getDetails(id: String): Promise<TestVariation> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/${id}`, requestOptions).then(
    handleResponse
  );
}

function setIgnoreAreas(
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

function setComment(id: string, comment: string): Promise<TestVariation> {
  const requestOptions = {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ comment }),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/comment/${id}`, requestOptions).then(
    handleResponse
  );
}
