import { useEffect, useState } from "react";
import { TEST_RUN_SHOW_DIFF_KEY } from "../../constants";

export const useShowDiff = () => {
  const [showDiff, setShowDiff] = useState(
    () => localStorage.getItem(TEST_RUN_SHOW_DIFF_KEY) !== "false",
  );
  useEffect(() => {
    localStorage.setItem(TEST_RUN_SHOW_DIFF_KEY, String(showDiff));
  }, [showDiff]);
  return [showDiff, setShowDiff] as const;
};
