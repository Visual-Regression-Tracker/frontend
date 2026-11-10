import { Locator } from "@playwright/test";
import { ImagePanes } from "./ImagePanes";
import { TEST_ID } from "~client/constants/locators";

export class TestDetailsDialog extends ImagePanes {
  step = this.page.getByTestId(TEST_ID.stepPosition);
  previousRun = this.page.getByLabel("Previous run");
  nextRun = this.page.getByLabel("Next run");
  closeBtn = this.iconButton(TEST_ID.closeIcon);

  editAreas = this.page.getByRole("button", { name: "Edit areas" });
  cancelBtn = this.page.getByRole("button", { name: "Cancel", exact: true });
  areasChip = this.page.getByRole("button", { name: /^Ignore areas \(\d+\)$/ });
  drawMode = this.iconButton(TEST_ID.addIcon);
  drawModeToggle = this.page.locator(`button[value="drawMode"]`);
  promptYes = this.page.getByRole("button", { name: "Yes" });
  promptDiscard = this.page.getByRole("button", { name: "Discard" });
  deleteArea = this.iconButton(TEST_ID.deleteIcon);
  clearAreas = this.iconButton(TEST_ID.layersClearIcon);
  applyAreas = this.iconButton(TEST_ID.collectionsIcon);
  saveAreas = this.iconButton(TEST_ID.saveIcon);

  zoomIn = this.page.getByRole("button", { name: "Zoom in" });
  zoomOut = this.page.getByRole("button", { name: "Zoom out" });
  zoomLevel = this.page.getByTestId(TEST_ID.zoomLevel);
  originalSize = this.page.getByRole("button", { name: "Original size" });
  fitToScreen = this.page.getByRole("button", { name: "Fit into screen" });

  // by text: the hotkey hint is part of the text, and "Approve variations…" must not match
  approve = this.page.getByRole("button").filter({ hasText: /^Approve\s?A$/ });
  reject = this.page.getByRole("button").filter({ hasText: /^Reject\s?X$/ });
  approveVariations = this.page
    .getByRole("button")
    .filter({ hasText: /^Approve variations…$/ });
  rejectVariations = this.page
    .getByRole("button")
    .filter({ hasText: /^Reject variations…$/ });
  undoApproval = this.page.getByRole("button", { name: "Undo approval" });
  undoRejection = this.page.getByRole("button", { name: "Undo rejection" });

  viewModes = this.page.getByRole("group", { name: "View mode" });
  sideBySide = this.viewModes.getByRole("button", {
    name: "Side by side",
    exact: true,
  });
  diffMode = this.viewModes.getByRole("button", { name: "Diff", exact: true });
  fadeMode = this.viewModes.getByRole("button", { name: "Fade", exact: true });
  overlayOpacity = this.page.getByTestId(TEST_ID.overlayOpacity);
  fadeSlider = this.overlayOpacity.getByRole("slider");
  differenceBlend = this.page.getByTestId(TEST_ID.differenceToggle);

  commentsBtn = this.page.getByRole("button", {
    name: /^(add|edit) comment/i,
  });
  commentChip = this.page.getByRole("button", { name: "Edit comment" });
  addCommentBtn = this.page.getByRole("button", { name: "Add comment" });
  vlmAnalysis = this.page.getByTestId(TEST_ID.vlmAnalysis);
  vlmMore = this.vlmAnalysis.getByRole("button", { name: "More" });
  comment = this.page.getByTestId(TEST_ID.comment);
  commentPopper = this.page.getByRole("tooltip").filter({ has: this.comment });
  commentSaveBtn = this.commentPopper.getByRole("button", { name: "Save" });
  // MUI's Fade sets opacity to 0 the moment it starts to close, 1 while open
  commentBox = this.commentPopper.locator(".MuiPaper-root");

  variations = this.page
    .getByRole("dialog")
    .filter({ hasText: "review before applying" });
  variationsToggleAll = this.variations.getByRole("checkbox", {
    name: /matching selected$/,
  });
  variationsToggleSkipped = this.variations.getByRole("checkbox", {
    name: /didn't match/,
  });
  // by label, not role name: a tooltip's title becomes the label's name
  variationsShowDiff = this.variations.getByLabel("Show diff", { exact: true });
  variationsCancel = this.variations.getByRole("button", { name: "Cancel" });
  variationThumbnails = this.variations.locator("img");

  noiseChip = this.page.getByTestId(TEST_ID.noiseHintPopoverChip);
  noisePanel = this.page.getByTestId(TEST_ID.noiseHintPanel);
  analyseRun = this.page.getByTestId(TEST_ID.analyseNoiseRunButton);

  discardPrompt = this.page.getByText("You have not saved ignore areas");

  fullSizeBaseline = this.page.getByAltText("baseline");
  fullSizeCheckpoint = this.page.getByAltText("checkpoint");

  variationsText(text: string): Locator {
    return this.variations.getByText(text);
  }

  viewVariationFullSize(name: string): Locator {
    return this.variations.getByRole("button", {
      name: `View ${name} full size`,
    });
  }

  variation(label: string): Locator {
    return this.variations.getByRole("checkbox", { name: label, exact: true });
  }

  variationsConfirm(verb: "Approve" | "Reject"): Locator {
    return this.variations.getByRole("button", {
      name: new RegExp(String.raw`^${verb} \d+ selected$`),
    });
  }

  warningIcons = this.page.getByTestId(TEST_ID.warningRoundedIcon);
  history = this.page.getByRole("button", { name: /^History/ });

  private iconButton(icon: string): Locator {
    return this.page
      .getByRole("button")
      .filter({ has: this.page.getByTestId(icon) });
  }

  private async blurFocus() {
    await this.page.evaluate(() =>
      (document.activeElement as HTMLElement)?.blur(),
    );
  }

  async goToNextByKeyboard() {
    await this.blurFocus();
    await this.page.keyboard.press("ArrowRight");
  }

  async chooseAreaKind(kind: "Ignore Areas" | "Compare Area") {
    await this.page
      .getByRole("group", { name: "Area type" })
      .getByRole("button", { name: kind })
      .click();
  }
}
