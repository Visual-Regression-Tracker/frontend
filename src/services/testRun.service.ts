import { TestRun } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/env.config";
import { UpdateIgnoreAreaDto } from "../types/ignoreArea";

const ENDPOINT_URL = "/test-runs";
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

function getJson<T>(path: string): Promise<T> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}${path}`, requestOptions).then(
    handleResponse<T>,
  );
}

function sendJson<T>(
  method: "POST" | "PATCH",
  path: string,
  body: unknown,
): Promise<T> {
  const requestOptions = {
    method,
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify(body),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}${path}`, requestOptions).then(
    handleResponse<T>,
  );
}

function getList(buildId: string): Promise<TestRun[]> {
  return getJson(`?buildId=${buildId}`);
}

function getDetails(id: string): Promise<TestRun> {
  return getJson(`/${id}`);
}

export interface BulkResult {
  succeeded: string[];
  failed: { id: string; message: string }[];
}

export const allSucceeded = (ids: string[] | number[]): BulkResult => ({
  succeeded: ids.map(String),
  failed: [],
});

function postBulk(path: string, ids: string[] | number[]): Promise<BulkResult> {
  return sendJson<BulkResult>("POST", path, ids);
}

function removeBulk(ids: string[] | number[]): Promise<BulkResult> {
  return postBulk("/delete", ids);
}

function rejectBulk(ids: string[] | number[]): Promise<BulkResult> {
  return postBulk("/reject", ids);
}

function approveBulk(
  ids: string[] | number[],
  merge: boolean,
): Promise<BulkResult> {
  return postBulk(`/approve?merge=${merge}`, ids);
}

export type ReviewDecision = "approve" | "reject";

// all or nothing: one run that cannot be reverted fails the whole request
function revert(ids: string[], decision: ReviewDecision): Promise<void> {
  return sendJson("POST", `/revert?decision=${decision}`, ids).then(
    () => undefined,
  );
}

export interface MatchingVariations {
  variations: TestRun[];
  skipped: (TestRun & { reason: string })[];
}

function getMatchingVariations(id: string): Promise<MatchingVariations> {
  return getJson(`/matchingSiblings/${id}`);
}

function updateIgnoreAreas(data: UpdateIgnoreAreaDto): Promise<void> {
  return sendJson("POST", "/ignoreAreas/update", data);
}

function addIgnoreAreas(data: UpdateIgnoreAreaDto): Promise<void> {
  return sendJson("POST", "/ignoreAreas/add", data);
}

function update(id: string, data: { comment: string }): Promise<TestRun> {
  return sendJson("PATCH", `/update/${id}`, data);
}

export const testRunService = {
  getList,
  getDetails,
  removeBulk,
  rejectBulk,
  approveBulk,
  revert,
  getMatchingVariations,
  updateIgnoreAreas,
  addIgnoreAreas,
  update,
};
