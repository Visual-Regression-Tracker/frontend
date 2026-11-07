import { BuildResult } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/env.config";

const ENDPOINT_URL = "/statistics";

function getResults(
  projectId: string,
  branchName?: string,
): Promise<BuildResult[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };
  const branch = branchName
    ? `&branchName=${encodeURIComponent(branchName)}`
    : "";

  return fetch(
    `${API_URL}${ENDPOINT_URL}/results?projectId=${projectId}${branch}`,
    requestOptions,
  ).then(handleResponse<BuildResult[]>);
}

export const statisticsService = {
  getResults,
};
