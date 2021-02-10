import { Dialog, makeStyles } from "@material-ui/core";
import React from "react";
import { useLocation } from "react-router-dom";
import {
  selectTestRun,
  useTestRunDispatch,
  useTestRunState,
} from "../../contexts";
import { QueryParams, getQueryParams } from "../../_helpers/route.helpers";
import { ArrowButtons } from "../ArrowButtons";
import TestDetailsModal from "../TestDetailsModal";

const useStyles = makeStyles((theme) => ({
  modal: {
    margin: 40,
  },
}));

export const TestDetailsDialog: React.FunctionComponent = () => {
  const classes = useStyles();
  const location = useLocation();
  const { testRuns, selectedTestRunIndex } = useTestRunState();
  const testRunDispatch = useTestRunDispatch();

  const queryParams: QueryParams = React.useMemo(
    () => getQueryParams(location.search),
    [location.search]
  );

  React.useEffect(() => {
    if (queryParams.testId) {
      selectTestRun(testRunDispatch, queryParams.testId);
    }
  }, [queryParams.testId, testRunDispatch]);

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
