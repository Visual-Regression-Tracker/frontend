import { staticService, testRunService } from "../../services";
import { BulkResult, allSucceeded } from "../../services/testRun.service";
import type { TestRun } from "../../types";
import { TAG_FIELDS, tagValuesOf } from "../../_helpers/testRunTags.helper";
import type { BulkAction } from "./bulkOperation.constants";

export const runBulkAction = ({
  action,
  shownSelectedIds,
  shownSelectedRows,
  eligibleRows,
}: {
  action: BulkAction | null;
  shownSelectedIds: string[];
  shownSelectedRows: TestRun[];
  eligibleRows: TestRun[];
}): Promise<BulkResult> => {
  const eligibleIds = eligibleRows.map((row) => row.id);

  if (action === "Delete") {
    return testRunService.removeBulk(shownSelectedIds);
  }

  if (action === "Download") {
    // one screen runs in several browsers and devices, so the name alone collides
    const images = shownSelectedRows.map((item) => ({
      filename: [item.name, ...tagValuesOf(item, TAG_FIELDS)].join(" - "),
      name: item.imageName,
    }));

    return staticService
      .downloadAsZip(images)
      .then(() => allSucceeded(shownSelectedIds));
  }

  if (action === "Reject") {
    return testRunService.rejectBulk(eligibleIds);
  }

  if (action === "Approve") {
    // the API takes one merge flag per request, so each kind goes on its own
    const mergeIds = eligibleRows
      .filter((row) => row.merge)
      .map((row) => row.id);
    const plainIds = eligibleRows
      .filter((row) => !row.merge)
      .map((row) => row.id);

    const groups = [
      { ids: plainIds, merge: false },
      { ids: mergeIds, merge: true },
    ].filter(({ ids }) => ids.length > 0);
    if (groups.length === 0) {
      return Promise.resolve(allSucceeded([]));
    }

    // one request failing outright must not hide what the other approved
    return Promise.allSettled(
      groups.map(({ ids, merge }) => testRunService.approveBulk(ids, merge)),
    ).then((outcomes) => {
      if (outcomes.every((outcome) => outcome.status === "rejected")) {
        throw outcomes[0].reason;
      }
      return {
        succeeded: outcomes.flatMap((outcome) =>
          outcome.status === "fulfilled" ? outcome.value.succeeded : [],
        ),
        failed: outcomes.flatMap((outcome, index) =>
          outcome.status === "fulfilled"
            ? outcome.value.failed
            : groups[index].ids.map((id) => ({
                id,
                message: String(outcome.reason),
              })),
        ),
      };
    });
  }

  return testRunService
    .updateIgnoreAreas({ ids: shownSelectedIds, ignoreAreas: [] })
    .then(() => allSucceeded(shownSelectedIds));
};
