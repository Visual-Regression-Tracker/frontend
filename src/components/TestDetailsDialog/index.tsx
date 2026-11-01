import { Dialog, Typography } from "@mui/material";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useBuildState, useTestRunState } from "../../contexts";
import { buildTestRunLocation } from "../../_helpers/route.helpers";
import { isTypingTarget } from "../../_helpers/hotkeys.helper";
import { orderByIds } from "../../_helpers/testRunGroup.helper";
import { BaseModal } from "../BaseModal";
import TestDetailsModal from "./TestDetailsModal";
import { TestRun } from "../../types";
import {
  neighbourImageNames,
  prefetchImages,
} from "../../_helpers/imagePrefetch.helper";

// the hotkeys stand down on this attribute; a variable, as a literal fails the paper's types
const reviewPaperProps = { "data-review-dialog": "" };

export const TestDetailsDialog = () => {
  const {
    selectedTestRun,
    touched,
    testRuns: allTestRuns,
    filteredSortedTestRunIds,
  } = useTestRunState();
  const { selectedBuild } = useBuildState();
  const navigate = useNavigate();
  const [notSavedChangesModal, setNotSavedChangesModal] = useState(false);
  const [navigationTargetId, setNavigationTargetId] = useState<string>();

  const isOpen = !!selectedTestRun;
  const testRuns = useMemo(() => {
    if (!isOpen) {
      return [];
    }
    return orderByIds(allTestRuns, filteredSortedTestRunIds);
  }, [isOpen, allTestRuns, filteredSortedTestRunIds]);

  const selectedTestRunIndex = useMemo(
    () => testRuns.findIndex((t) => t.id === selectedTestRun?.id),
    [testRuns, selectedTestRun?.id],
  );

  const prefetched = useRef<Set<string>>(new Set());
  useEffect(() => {
    prefetchImages(
      neighbourImageNames(testRuns, selectedTestRunIndex),
      prefetched.current,
    );
  }, [testRuns, selectedTestRunIndex]);

  const navigateById = useCallback(
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

  // by position, not .at(): a negative index would wrap round to the last run
  const navigateByIndex = useCallback(
    (index: number) => {
      if (selectedTestRunIndex === -1) {
        return;
      }
      const testRun: TestRun | undefined = testRuns[index];
      if (testRun) {
        navigateById(testRun.id);
      }
    },
    [testRuns, selectedTestRunIndex, navigateById],
  );

  if (!selectedTestRun) {
    return null;
  }

  return (
    <Dialog
      open={true}
      fullScreen
      sx={{ margin: "20px 10px 10px 10px" }}
      slotProps={{ paper: reviewPaperProps }}
      // Escape is the Dialog's: it stops the key before a document hotkey sees it
      onClose={(event, reason) => {
        if (
          reason === "escapeKeyDown" &&
          !isTypingTarget((event as KeyboardEvent).target)
        ) {
          navigateById();
        }
      }}
    >
      <TestDetailsModal
        testRun={selectedTestRun}
        currentRunIndex={selectedTestRunIndex}
        totalTestRunCount={testRuns.length}
        touched={touched}
        handleClose={() => navigateById()}
        handlePrevious={() => navigateByIndex(selectedTestRunIndex - 1)}
        handleNext={() => navigateByIndex(selectedTestRunIndex + 1)}
        navigateTo={navigateById}
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
