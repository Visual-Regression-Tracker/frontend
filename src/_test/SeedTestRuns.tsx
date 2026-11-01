import { useEffect } from "react";
import { useTestRunDispatch } from "../contexts";
import { TestRun } from "../types";

// `order` is what the list publishes as its filtered and sorted ids
export const SeedTestRuns = ({
  testRuns,
  order,
}: {
  testRuns: TestRun[];
  order?: string[];
}) => {
  const dispatch = useTestRunDispatch();

  useEffect(() => {
    dispatch({ type: "get", payload: testRuns });
  }, [dispatch, testRuns]);

  useEffect(() => {
    if (order) {
      dispatch({ type: "filterSort", payload: order });
    }
  }, [dispatch, order]);

  return null;
};
