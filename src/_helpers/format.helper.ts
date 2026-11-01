export const formatDateTime = (date: string) => new Date(date).toLocaleString();

export const pluralize = (
  count: number,
  singular: string,
  plural = `${singular}s`,
): string => (count === 1 ? singular : plural);

export const partialFailureText = (
  verb: string,
  result: { succeeded: unknown[]; failed: { message: string }[] },
  what: string,
): string =>
  `${verb} ${result.succeeded.length} of ${what}. ${result.failed.length} failed: ${result.failed[0].message}`;
