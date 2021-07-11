import { Dialog, makeStyles } from "@material-ui/core";
import React from "react";
import { useTestRunState } from "../../contexts";
import { ArrowButtons } from "../ArrowButtons";
import TestDetailsModal from "../TestDetailsModal";

const useStyles = makeStyles((theme) => ({
  modal: {
    margin: 40,
  },
}));

export const TestDetailsDialog: React.FunctionComponent = () => {
  const classes = useStyles();
  const {
    testRuns: allTestRuns,
    filteredTestRuns,
    selectedTestRunId,
  } = useTestRunState();

  const testRuns = React.useMemo(() => filteredTestRuns ?? allTestRuns, [
    allTestRuns,
    filteredTestRuns,
  ]);

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
