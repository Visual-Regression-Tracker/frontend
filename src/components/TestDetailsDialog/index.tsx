import { Dialog, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router";
import { useBuildState, useTestRunState } from "../../contexts";
import { buildTestRunLocation } from "../../_helpers/route.helpers";
import { BaseModal } from "../BaseModal";
import TestDetailsModal from "./TestDetailsModal";
import { TestRun } from "../../types";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles(() => ({
  modal: {
    margin: "20px 10px 10px 10px",
  },
}));

export const TestDetailsDialog: React.FunctionComponent = () => {
  const classes = useStyles();
  const {
    selectedTestRun,
    touched,
    testRuns: allTestRuns,
    filteredSortedTestRunIds,
  } = useTestRunState();
  const { selectedBuild } = useBuildState();
  const navigate = useNavigate();
  const [notSavedChangesModal, setNotSavedChangesModal] = React.useState(false);
  const [navigationTargetId, setNavigationTargetId] = React.useState<string>();

  const testRuns = React.useMemo(() => {
    if(filteredSortedTestRunIds) {
      return allTestRuns
      .filter((tr) => filteredSortedTestRunIds.includes(tr.id))
      .sort(
        (a, b) =>
        filteredSortedTestRunIds.indexOf(a.id) - filteredSortedTestRunIds.indexOf(b.id),
      )
    }
    return allTestRuns;
  }, [allTestRuns, filteredSortedTestRunIds]);

  const selectedTestRunIndex = React.useMemo(
    () => testRuns.findIndex((t) => t.id === selectedTestRun?.id),
    [testRuns, selectedTestRun?.id],
  );

  const navigateById = React.useCallback(
    (id?: string) => {
      if (touched) {
        setNavigationTargetId(id);
        setNotSavedChangesModal(true);
      } else {
        navigate(buildTestRunLocation(selectedBuild?.id, id));
      }
    },
    [touched, navigate, selectedBuild?.id],
  );

  const navigateByIndex = React.useCallback(
    (index: number) => {
      const testRun: TestRun | undefined = testRuns.at(index);
      if (testRun) {
        navigateById(testRun.id);
      }
    },
    [testRuns, navigateById],
  );

  if (!selectedTestRun) {
    return null;
  }

  return (
    <Dialog open={true} fullScreen className={classes.modal}>
      <TestDetailsModal
        testRun={selectedTestRun}
        currentRunIndex={testRuns.findIndex(
          (item) => item.id === selectedTestRun.id,
        )}
        totalTestRunCount={testRuns.length}
        touched={touched}
        handleClose={() => navigateById()}
        handlePrevious={() => navigateByIndex(selectedTestRunIndex - 1)}
        handleNext={() => navigateByIndex(selectedTestRunIndex + 1)}
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
          navigate(buildTestRunLocation(selectedBuild?.id, navigationTargetId));
          setNotSavedChangesModal(false);
        }}
      />
    </Dialog>
  );
};
