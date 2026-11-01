import { TestRun } from "../types";
import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { API_URL } from "../_config/env.config";
import { UpdateIgnoreAreaDto } from "../types/ignoreArea";

const ENDPOINT_URL = "/test-runs";
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

function getList(buildId: string): Promise<TestRun[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}?buildId=${buildId}`,
    requestOptions,
  ).then(handleResponse);
}

function getDetails(id: string): Promise<TestRun> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/${id}`, requestOptions).then(
    handleResponse,
  );
}

export interface BulkResult {
  succeeded: string[];
  failed: { id: string; message: string }[];
}

export const allSucceeded = (ids: string[] | number[]): BulkResult => ({
  succeeded: ids.map(String),
  failed: [],
});

// An older backend answers with an empty body: nothing failed, or it would have thrown.
function toBulkResult(ids: string[] | number[], body: unknown): BulkResult {
  const answer = (body || {}) as Partial<BulkResult>;
  if (Array.isArray(answer.succeeded) && Array.isArray(answer.failed)) {
    return { succeeded: answer.succeeded, failed: answer.failed };
  }
  return allSucceeded(ids);
}

function postIds(path: string, ids: string[] | number[]): Promise<unknown> {
  const requestOptions = {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify(ids),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/${path}`, requestOptions).then(
    handleResponse,
  );
}

function postBulk(path: string, ids: string[] | number[]): Promise<BulkResult> {
  return postIds(path, ids).then((body) => toBulkResult(ids, body));
}

function removeBulk(ids: string[] | number[]): Promise<BulkResult> {
  return postBulk("delete", ids);
}

function rejectBulk(ids: string[] | number[]): Promise<BulkResult> {
  return postBulk("reject", ids);
}

function approveBulk(
  ids: string[] | number[],
  merge: boolean,
): Promise<BulkResult> {
  return postBulk(`approve?merge=${merge}`, ids);
}

// the backend answers per run, and a refusal comes back in a successful answer
function rejectIfRefused(id: string, result: BulkResult): Promise<void> {
  const refusal = result.failed.find((failure) => failure.id === id);
  return refusal ? Promise.reject(refusal.message) : Promise.resolve();
}

function approveOne(id: string, merge: boolean): Promise<void> {
  return testRunService
    .approveBulk([id], merge)
    .then((result) => rejectIfRefused(id, result));
}

function rejectOne(id: string): Promise<void> {
  return testRunService
    .rejectBulk([id])
    .then((result) => rejectIfRefused(id, result));
}

// all or nothing: one run that cannot be reverted fails the whole request
function revert(ids: string[]): Promise<void> {
  return postIds("revert", ids).then(() => undefined);
}

export interface MatchingVariations {
  variations: TestRun[];
  skipped: (TestRun & { reason: string })[];
}

function getMatchingVariations(id: string): Promise<MatchingVariations> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/matchingSiblings/${id}`,
    requestOptions,
  ).then(handleResponse);
}

function updateIgnoreAreas(data: UpdateIgnoreAreaDto): Promise<void> {
  const requestOptions = {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify(data),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/ignoreAreas/update`,
    requestOptions,
  ).then(handleResponse);
}

function addIgnoreAreas(data: UpdateIgnoreAreaDto): Promise<void> {
  const requestOptions = {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify(data),
  };

  return fetch(
    `${API_URL}${ENDPOINT_URL}/ignoreAreas/add`,
    requestOptions,
  ).then(handleResponse);
}

function update(
  id: string,
  data: {
    comment: string;
  },
): Promise<TestRun> {
  const requestOptions = {
    method: "PATCH",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify(data),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/update/${id}`, requestOptions).then(
    handleResponse,
  );
}

export const testRunService = {
  getList,
  getDetails,
  removeBulk,
  rejectBulk,
  approveBulk,
  approveOne,
  rejectOne,
  revert,
  getMatchingVariations,
  updateIgnoreAreas,
  addIgnoreAreas,
  update,
};
