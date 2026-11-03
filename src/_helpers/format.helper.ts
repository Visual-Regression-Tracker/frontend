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
  result: { succeeded: unknown[]; failed: { id?: string; message: string }[] },
  what: string,
  nameOf: (id: string) => string | undefined = () => undefined,
): string => {
  const shown = result.failed.find(isInternalError) ?? result.failed[0];
  const name = shown.id && nameOf(shown.id);
  const message =
    shown.id && name
      ? shown.message.replace(shown.id, `"${name}"`)
      : shown.message;
  return `${verb} ${result.succeeded.length} of ${what}. ${result.failed.length} failed: ${message}`;
};
