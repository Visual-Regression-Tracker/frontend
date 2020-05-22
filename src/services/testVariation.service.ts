import { TestVariation } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/api.config";

export const testVariationService = {
  get,
};

function get(projectId: String): Promise<TestVariation[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}/test-variations?projectId=${projectId}`, requestOptions).then(handleResponse);
}
