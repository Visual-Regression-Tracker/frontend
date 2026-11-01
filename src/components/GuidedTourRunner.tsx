import { EventData, Joyride, STATUS, Step } from "react-joyride";
import { brand } from "../theme/tokens";

interface Props {
  steps: Step[];
  onClose: () => void;
}

const GuidedTourRunner = ({ steps, onClose }: Props) => {
  const stepCount = steps.length;

  const handleJoyrideEvent = ({ status }: EventData) => {
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onClose();
    }
  };

  return (
    <Joyride
      onEvent={handleJoyrideEvent}
      continuous
      run
      scrollToFirstStep
      steps={steps}
      // joyride 3 leaves the progress off the last step's button
      locale={{
        nextWithProgress: "Next ({current}/{total})",
        last: `Last (${stepCount}/${stepCount})`,
      }}
      options={{
        buttons: ["back", "primary", "skip"],
        skipBeacon: true,
        blockTargetInteraction: true,
        showProgress: true,
        dismissKeyAction: false,
        zIndex: 10000,
        spotlightRadius: 14,
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
  );
};

export default GuidedTourRunner;
