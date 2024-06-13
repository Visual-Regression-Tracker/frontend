import React from "react";
import { Button, IconButton, Grid } from "@mui/material";
import { Close } from "@mui/icons-material";
import { TooltipRenderProps } from "react-joyride";

// https://github.com/gilbarbara/react-joyride/blob/main/docs/custom-components.md
const GuidedTourJoyrideTooltip = ({
  backProps,
  closeProps,
  continuous,
  index,
  isLastStep,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps): React.JSX.Element => {
  const {
    content,
    hideBackButton,
    hideCloseButton,
    hideFooter,
    showProgress,
    showSkipButton,
    title,
    styles,
  } = step;

  const { back, close, last, next, skip } = step.locale;

  const primaryButton = () => {
    let output = close;
    if (continuous) {
      output = isLastStep ? last : next;
    }
    return (
      <Button
        data-testid="tour-button-next"
        variant="contained"
        color="primary"
        {...primaryProps}
      >
        {output}
        {continuous && showProgress && ` (${index + 1}/${size})`}
      </Button>
    );
  };

  const skipButton = () => {
    return (
      <Button
        style={styles?.buttonSkip}
        data-testid="tour-button-skip"
        aria-live="off"
        {...skipProps}
      >
        {skip}
      </Button>
    );
  };
  const backButton = () => {
    return (
      <Button
        variant="contained"
        color="secondary"
        data-testid="tour-button-back"
        {...backProps}
      >
        {back}
      </Button>
    );
  };
  const closeButton = () => {
    return (
      <IconButton
        style={styles?.buttonClose}
        data-testid="tour-button-close"
        {...closeProps}
        size="large"
      >
        <Close />
      </IconButton>
    );
  };

  return (
    <div
      key="JoyrideTooltip"
      className="react-joyride__tooltip"
      style={styles?.tooltip}
      aria-describedby="help-description"
      {...tooltipProps}
    >
      <div style={styles?.tooltipContainer}>
        {title && (
          <h4 style={styles?.tooltipTitle} aria-label={title}>
            {title}
          </h4>
        )}
        <div id="help-description" style={styles?.tooltipContent}>
          {content}
        </div>
      </div>
      {!hideFooter && (
        <div style={styles?.tooltipFooter}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              {showSkipButton && !isLastStep && skipButton()}
            </Grid>
            <Grid item xs={4}>
              {!hideBackButton && index > 0 && backButton()}
            </Grid>
            <Grid item xs={4}>
              {primaryButton()}
            </Grid>
          </Grid>
        </div>
      )}
      {!hideCloseButton && closeButton()}
    </div>
  );
};

export default GuidedTourJoyrideTooltip;