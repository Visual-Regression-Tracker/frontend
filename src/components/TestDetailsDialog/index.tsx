import { Dialog, makeStyles } from "@material-ui/core";
import React from "react";
import { useTestRunState } from "../../contexts";
import { ArrowButtons } from "./ArrowButtons";
import TestDetailsModal from "./TestDetailsModal";

const useStyles = makeStyles((theme) => ({
  modal: {
    margin: 40,
  },
}));

export const TestDetailsDialog: React.FunctionComponent = () => {
  const classes = useStyles();
  const {
    testRuns: allTestRuns,
    filteredTestRunIds,
    sortedTestRunIds,
    selectedTestRunId,
  } = useTestRunState();

  const testRuns = React.useMemo(() => {
    const filtered = filteredTestRunIds
      ? allTestRuns.filter((tr) => filteredTestRunIds.includes(tr.id))
      : allTestRuns;

    const sorted = sortedTestRunIds
      ? filtered
          .slice()
          .sort(
            (a, b) =>
              sortedTestRunIds.indexOf(a.id) - sortedTestRunIds.indexOf(b.id)
          )
      : filtered;
    return sorted;
  }, [allTestRuns, filteredTestRunIds, sortedTestRunIds]);

  const selectedTestRunIndex = React.useMemo(
    () => testRuns.findIndex((t) => t.id === selectedTestRunId),
    [testRuns, selectedTestRunId]
  );

  if (selectedTestRunIndex === undefined || !testRuns[selectedTestRunIndex]) {
    return null;
  }

  return (
    <Dialog open={true} fullScreen className={classes.modal}>
      <TestDetailsModal testRun={testRuns[selectedTestRunIndex]} />
      <ArrowButtons
        testRuns={testRuns}
        selectedTestRunIndex={selectedTestRunIndex}
      />
    </Dialog>
  );
};
