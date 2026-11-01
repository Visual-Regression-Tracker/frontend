import { Suspense, lazy, type MouseEvent, useState } from "react";
import { Button } from "@mui/material";
import { useHelpState } from "../contexts";
import { LiveHelp } from "@mui/icons-material";
import { TAKE_TOUR_BUTTON_TEST_ID } from "./GuidedTour.locators";

const GuidedTourRunner = lazy(() => import("./GuidedTourRunner"));

const GuidedTour = () => {
  const [run, setRun] = useState(false);
  const { helpSteps } = useHelpState();

  const handleClickStart = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();

    // joyride 3 starts only when run turns true with steps in hand
    const [firstStep] = helpSteps;
    if (!firstStep) {
      return;
    }

    if (typeof firstStep.target === "string") {
      const targetId = firstStep.target.startsWith("#")
        ? firstStep.target.slice(1)
        : firstStep.target;

      if (!document.getElementById(targetId)) {
        return;
      }
    }

    setRun(true);
  };

  return (
    <Button
      startIcon={<LiveHelp />}
      onClick={handleClickStart}
      data-testid={TAKE_TOUR_BUTTON_TEST_ID}
    >
      {run && (
        <Suspense fallback={null}>
          <GuidedTourRunner steps={helpSteps} onClose={() => setRun(false)} />
        </Suspense>
      )}
      Take a tour
    </Button>
  );
};

export default GuidedTour;
