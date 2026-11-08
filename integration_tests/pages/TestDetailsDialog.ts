import { Locator } from "@playwright/test";
import { PageObject } from "./PageObject";
import { boxOf } from "utils/boxOf";
import { defined } from "utils/defined";
import { TEST_ID } from "~client/constants/locators";

type KonvaNode = {
  x: () => number;
  y: () => number;
  width: () => number;
  height: () => number;
  draggable: () => boolean;
  getParent: () => { getClassName: () => string };
  image: () => HTMLImageElement;
  opacity: () => number;
  globalCompositeOperation: () => string;
};
type KonvaStage = {
  container: () => HTMLElement;
  find: (selector: string) => KonvaNode[];
  findOne: (selector: string) => KonvaNode | undefined;
};
type KonvaWindow = { Konva: { stages: KonvaStage[] } };

export type Rect = { x: number; y: number; width: number; height: number };

export class TestDetailsDialog extends PageObject {
  drawAreas = this.page.getByTestId(TEST_ID.drawArea);
  firstPane = this.drawAreas.first();
  canvases = this.drawAreas.locator("canvas");
  checkpointPane = this.drawAreas.nth(1);
  imageSize = this.page.getByTestId(TEST_ID.imageSize);

  step = this.page.getByTestId(TEST_ID.stepPosition);
  previousRun = this.page.getByLabel("Previous run");
  nextRun = this.page.getByLabel("Next run");
  closeBtn = this.iconButton(TEST_ID.closeIcon);

  editAreas = this.page.getByRole("button", { name: "Edit areas" });
  cancelEditing = this.page.getByRole("button", {
    name: "Cancel",
    exact: true,
  });
  areasChip = this.page.getByRole("button", { name: /^Ignore areas \(\d+\)$/ });
  drawMode = this.iconButton(TEST_ID.addIcon);
  drawModeToggle = this.page.locator(`button[value="drawMode"]`);
  lastCanvas = this.canvases.last();
  promptYes = this.page.getByRole("button", { name: "Yes" });
  promptCancel = this.page.getByRole("button", { name: "Cancel" });
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
  sideBySide = this.viewModes.getByRole("button", { name: "Side by side" });
  diffMode = this.viewModes.getByRole("button", { name: "Diff", exact: true });
  noiselessMode = this.viewModes.getByRole("button", {
    name: "Diff without noise",
  });
  noiselessProgress = this.page.getByRole("progressbar", {
    name: "Computing Diff without noise",
  });
  noiselessCaveat = this.page.getByTestId(TEST_ID.noiselessCaveat);
  switchToDiff = this.page.getByRole("button", { name: "Switch to Diff" });
  fadeMode = this.viewModes.getByRole("button", { name: "Fade" });
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
  hintBlur = this.page.getByTestId(TEST_ID.hintAreasBlur);
  hintDinov2 = this.page.getByTestId(TEST_ID.hintAreasDinov2);

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

  ignoreRects(): Promise<Rect[]> {
    return this.rects(true);
  }

  lockedRects(): Promise<Rect[]> {
    return this.rects(false);
  }

  private rects(draggable: boolean): Promise<Rect[]> {
    return this.checkpointPane.evaluate((pane, draggable) => {
      const { Konva } = window as unknown as KonvaWindow;
      const stage = Konva.stages.find((s) => pane.contains(s.container()));
      if (!stage) throw new Error("No Konva stage in the checkpoint pane");

      return (
        stage
          .find("Rect")
          // the resize handles of a selected area are rects too
          .filter((rect) => rect.getParent().getClassName() !== "Transformer")
          // the areas applied at upload are drawn too, and cannot be moved
          .filter((rect) => rect.draggable() === draggable)
          .map((rect) => ({
            x: rect.x(),
            y: rect.y(),
            width: rect.width(),
            height: rect.height(),
          }))
      );
    }, draggable);
  }

  hasSelection(): Promise<boolean> {
    return this.checkpointPane.evaluate((pane) => {
      const { Konva } = window as unknown as KonvaWindow;
      const stage = Konva.stages.find((s) => pane.contains(s.container()));
      if (!stage) throw new Error("No Konva stage in the checkpoint pane");

      return stage.find("Transformer").length > 0;
    });
  }

  async shownImage(): Promise<string> {
    const src = await this.checkpointPane.evaluate((pane) => {
      const { Konva } = window as unknown as KonvaWindow;
      const stage = Konva.stages.find((s) => pane.contains(s.container()));
      if (!stage) throw new Error("No Konva stage in the checkpoint pane");
      const image = stage.find("Image").at(-1);
      if (!image) throw new Error("No image in the checkpoint pane");

      return image.image().src;
    });

    return src.split("/").pop() ?? "";
  }

  /** Pure red pixels of the computed Diff without noise image; null until it is shown. */
  keptPixels(): Promise<number | null> {
    return this.checkpointPane.evaluate((pane) => {
      const { Konva } = window as unknown as KonvaWindow;
      const stage = Konva.stages.find((s) => pane.contains(s.container()));
      const image = stage?.find("Image").at(-1)?.image();
      if (!image?.src.startsWith("blob:")) return null;
      const context = new OffscreenCanvas(
        image.naturalWidth,
        image.naturalHeight,
      ).getContext("2d");
      if (!context) throw new Error("No 2d context");
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
      );
      let kept = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] === 255 && data[i + 1] === 0 && data[i + 2] === 0) kept++;
      }
      return kept;
    });
  }

  async canvasWidths(): Promise<number[]> {
    const panes = await this.drawAreas.all();

    return Promise.all(
      panes.map(
        async (pane) =>
          (await pane.locator("canvas").first().boundingBox())?.width ?? 0,
      ),
    );
  }

  private checkpointCanvasBox() {
    return boxOf(this.checkpointPane.locator("canvas").first());
  }

  /** Image pixels from the top left; they match the screen's only at original size. */
  async drag(from: { x: number; y: number }, to: { x: number; y: number }) {
    const box = await this.checkpointCanvasBox();
    const { mouse } = this.page;

    await mouse.move(box.x + from.x, box.y + from.y);
    await mouse.down();
    await mouse.move(box.x + to.x, box.y + to.y, { steps: 5 });
    await mouse.up();
  }

  async clickAt(point: { x: number; y: number }) {
    const box = await this.checkpointCanvasBox();

    await this.page.mouse.click(box.x + point.x, box.y + point.y);
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

  paneBounds() {
    return boxOf(this.firstPane);
  }

  firstCanvasBounds() {
    return boxOf(this.canvases.first());
  }

  async wheelAt(
    point: { x: number; y: number },
    deltaY: number,
    times: number,
  ) {
    await this.page.mouse.move(point.x, point.y);
    for (let i = 0; i < times; i++) {
      await this.page.mouse.wheel(0, deltaY);
    }
  }

  wheelOffArtworkIsPrevented(): Promise<boolean> {
    return this.firstPane.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const event = new WheelEvent("wheel", {
        deltaY: 120,
        clientX: box.right - 5,
        clientY: box.bottom - 5,
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(event);
      return event.defaultPrevented;
    });
  }

  zoomInTowardsCornerScroll(): Promise<{ left: number; top: number }> {
    return this.firstPane.evaluate(async (el) => {
      const box = el.getBoundingClientRect();

      for (let i = 0; i < 20; i++) {
        el.dispatchEvent(
          new WheelEvent("wheel", {
            deltaY: -120,
            clientX: box.right - 20,
            clientY: box.bottom - 20,
            bubbles: true,
            cancelable: true,
          }),
        );
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      return { left: el.scrollLeft, top: el.scrollTop };
    });
  }

  zoomInCanvasWidths(): Promise<number[]> {
    return this.firstPane.evaluate(async (el) => {
      const canvas = el.querySelector<HTMLCanvasElement>("canvas");
      if (!canvas) throw new Error("No canvas in the pane");
      const box = el.getBoundingClientRect();

      for (let i = 0; i < 20; i++) {
        el.dispatchEvent(
          new WheelEvent("wheel", {
            deltaY: -120,
            clientX: box.left + 20,
            clientY: box.top + 20,
            bubbles: true,
            cancelable: true,
          }),
        );
      }

      const samples: number[] = [];

      for (let frame = 0; frame < 12; frame++) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        samples.push(Math.round(canvas.getBoundingClientRect().width));
      }

      return samples;
    });
  }

  zoomedContentWidth(): Promise<number> {
    return this.firstPane.evaluate(
      (el) => (el.firstElementChild as HTMLElement).offsetWidth,
    );
  }

  async overlaidOpacity(): Promise<number> {
    return (await this.overlaidState()).opacity;
  }

  async overlaidBlend(): Promise<string> {
    return (await this.overlaidState()).blend;
  }

  private overlaidState(): Promise<{ opacity: number; blend: string }> {
    return this.firstPane.evaluate(() => {
      const { Konva } = window as unknown as KonvaWindow;
      const overlaid = Konva.stages
        .map((stage) => stage.findOne(".overlaid"))
        .find(Boolean);
      if (!overlaid) throw new Error("No overlaid image on any stage");

      return {
        opacity: overlaid.opacity(),
        blend: overlaid.globalCompositeOperation(),
      };
    });
  }

  /** Page coordinates, for gestures that must end outside the image. */
  async dragOnPage(
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) {
    const viewport = defined(this.page.viewportSize(), "The viewport size");
    const { mouse } = this.page;

    // Firefox never sees the release outside the window: stop at its edge, still past the image
    await mouse.move(from.x, from.y);
    await mouse.down();
    await mouse.move(
      Math.min(Math.max(to.x, 0), viewport.width - 1),
      Math.min(Math.max(to.y, 0), viewport.height - 1),
      { steps: 10 },
    );
    await mouse.up();
  }

  async clickOnPage(point: { x: number; y: number }) {
    await this.page.mouse.click(point.x, point.y);
  }

  async chooseAreaKind(kind: "Ignore Areas" | "Compare Area") {
    await this.page
      .getByRole("group", { name: "Area type" })
      .getByRole("button", { name: kind })
      .click();
  }
}
