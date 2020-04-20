import { Test } from "../types";
import {
  handleResponse,
  authHeader,
} from "../_helpers/service.helpers";
import { API_URL } from "../_config/api.config";

export const testsService = {
  getAll,
};

function getAll(buildId: number): Promise<Test[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}/tests/${buildId}`, requestOptions).then(
    handleResponse
  );
}
