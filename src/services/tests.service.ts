import { Test } from "../types";
import {
  API_URL,
  handleResponse,
  authHeader,
} from "../_helpers/service.helpers";

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
