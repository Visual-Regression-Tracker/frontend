import React, { FunctionComponent } from "react";
import { EventData, Joyride, STATUS } from "react-joyride";
import { Button } from "@mui/material";
import { useHelpState } from "../contexts";
import { LiveHelp } from "@mui/icons-material";
import { TAKE_TOUR_BUTTON_TEST_ID } from "./GuidedTour.locators";
import { brand } from "../theme/tokens";

const GuidedTour: FunctionComponent = () => {
  const [run, setRun] = React.useState(false);
  const { helpSteps } = useHelpState();
  const stepCount = helpSteps.length;

  const handleJoyrideEvent = ({ status }: EventData) => {
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
    }
  };

  const handleClickStart = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    // joyride 3 starts only when run turns true with steps in hand; a run set
    // on a page without steps would keep the button from doing anything later
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
      <Joyride
        onEvent={handleJoyrideEvent}
        continuous
        run={run}
        scrollToFirstStep
        steps={helpSteps}
        // joyride 3 leaves the progress off the last step's button
        locale={{
          nextWithProgress: "Next ({current}/{total})",
          last: `Last (${stepCount}/${stepCount})`,
        }}
        options={{
          buttons: ["back", "primary", "skip"],
          skipBeacon: true,
          // the highlighted element stays inert, as it was with joyride 2: a
          // click on it would navigate or open a dialog under the tour
          blockTargetInteraction: true,
          showProgress: true,
          dismissKeyAction: false,
          zIndex: 10000,
          spotlightRadius: 14,
          // the theme's CSS variables, so the tour follows the colour mode
          // joyride derives the beacon's tint from this, so it needs a hex
          primaryColor: brand[700],
          backgroundColor: "var(--mui-palette-background-paper)",
          textColor: "var(--mui-palette-text-primary)",
          arrowColor: "var(--mui-palette-background-paper)",
          overlayColor: "rgba(15, 23, 42, 0.55)",
        }}
        styles={{
          tooltip: {
            borderRadius: 14,
            padding: 20,
            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.24)",
          },
          tooltipTitle: {
            fontSize: 16,
            fontWeight: 700,
            textAlign: "left",
            margin: 0,
          },
          tooltipContent: {
            padding: "8px 0 4px",
            fontSize: 14,
            lineHeight: 1.5,
            textAlign: "left",
            color: "var(--mui-palette-text-secondary)",
          },
          tooltipFooter: { marginTop: 15 },
          buttonPrimary: {
            backgroundColor: "var(--mui-palette-primary-main)",
            color: "var(--mui-palette-primary-contrastText)",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            padding: "8px 14px",
          },
          buttonBack: {
            color: "var(--mui-palette-text-secondary)",
            fontSize: 14,
            fontWeight: 600,
          },
          buttonSkip: {
            color: "var(--mui-palette-text-secondary)",
            fontSize: 14,
          },
        }}
      />
      Take a tour
    </Button>
  );
};

export default GuidedTour;
