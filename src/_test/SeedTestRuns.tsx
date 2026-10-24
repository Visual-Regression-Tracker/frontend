import React from "react";
import { useTestRunDispatch } from "../contexts";
import { TestRun } from "../types";

// Puts test runs into the TestRunProvider the way the list does after loading,
// so a component that reads them from the context has something to read.
export const SeedTestRuns: React.FunctionComponent<{ testRuns: TestRun[] }> = ({
  testRuns,
}) => {
  const dispatch = useTestRunDispatch();

  React.useEffect(() => {
    dispatch({ type: "get", payload: testRuns });
  }, [dispatch, testRuns]);

  return null;
};
