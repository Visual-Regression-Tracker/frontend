export const formatDateTime = (date: string) => new Date(date).toLocaleString();

export const pluralize = (
  count: number,
  singular: string,
  plural = `${singular}s`,
): string => (count === 1 ? singular : plural);

// the backend's answer for runs it never got to after an unexpected error
const isInternalError = (failure: { message: string }): boolean =>
  failure.message === "Internal error";

export const failureVariant = (
  failed: { message: string }[],
): "error" | "warning" => (failed.some(isInternalError) ? "error" : "warning");

export const partialFailureText = (
  verb: string,
  result: { succeeded: unknown[]; failed: { message: string }[] },
  what: string,
): string =>
  `${verb} ${result.succeeded.length} of ${what}. ${result.failed.length} failed: ${result.failed[0].message}`;
