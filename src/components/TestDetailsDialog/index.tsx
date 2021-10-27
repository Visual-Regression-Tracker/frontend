import { Dialog, makeStyles, Typography } from "@material-ui/core";
import React from "react";
import { useHistory } from "react-router";
import { useBuildState, useTestRunState } from "../../contexts";
import { buildTestRunLocation } from "../../_helpers/route.helpers";
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
    selectedTestRun,
    touched,
    testRuns: allTestRuns,
    filteredTestRunIds,
    sortedTestRunIds,
  } = useTestRunState();
  const { selectedBuild } = useBuildState();
  const history = useHistory();
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
    () => testRuns.findIndex((t) => t.id === selectedTestRun?.id),
    [testRuns, selectedTestRun?.id]
  );

  const handleNavigation = React.useCallback(
    (id?: string) => {
      if (touched) {
        setNavigationTargetId(id);
        setNotSavedChangesModal(true);
      } else {
        history.push(buildTestRunLocation(selectedBuild?.id, id));
      }
    },
    [touched, history, selectedBuild?.id]
  );

  if (!selectedTestRun) {
    return null;
  }

  return (
    <Dialog open={true} fullScreen className={classes.modal}>
      <TestDetailsModal
        testRun={selectedTestRun}
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
          history.push(
            buildTestRunLocation(selectedBuild?.id, navigationTargetId)
          );
          setNotSavedChangesModal(false);
        }}
      />
    </Dialog>
  );
};
