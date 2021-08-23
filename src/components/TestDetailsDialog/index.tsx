import { Dialog, makeStyles, Typography } from "@material-ui/core";
import React from "react";
import {
  selectTestRun,
  useTestRunDispatch,
  useTestRunState,
} from "../../contexts";
import { BaseModal } from "../BaseModal";
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
    testRun,
    touched,
    testRuns: allTestRuns,
    filteredTestRunIds,
    sortedTestRunIds,
    selectedTestRunId,
  } = useTestRunState();
  const testRunDispatch = useTestRunDispatch();
  const [notSavedChangesModal, setNotSavedChangesModal] = React.useState(false);
  const [navigationTargetId, setNavigationTargetId] = React.useState<string>();

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

  const handleNavigation = React.useCallback(
    (id?: string) => {
      if (touched) {
        setNavigationTargetId(id);
        setNotSavedChangesModal(true);
      } else {
        selectTestRun(testRunDispatch, id);
      }
    },
    [testRunDispatch, touched]
  );

  if (!testRun) {
    return null;
  }

  return (
    <Dialog open={true} fullScreen className={classes.modal}>
      <TestDetailsModal
        testRun={testRun}
        touched={touched}
        handleClose={() => handleNavigation()}
      />
      <ArrowButtons
        testRuns={testRuns}
        selectedTestRunIndex={selectedTestRunIndex}
        handleNavigation={handleNavigation}
      />
      <BaseModal
        open={notSavedChangesModal}
        title={"You have not saved ignore areas"}
        submitButtonText={"Discard"}
        onCancel={() => setNotSavedChangesModal(false)}
        content={
          <Typography>{`Are you sure you want to discard changes?`}</Typography>
        }
        onSubmit={() => {
          selectTestRun(testRunDispatch, navigationTargetId);
          setNotSavedChangesModal(false);
        }}
      />
    </Dialog>
  );
};
