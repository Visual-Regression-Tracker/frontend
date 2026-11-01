import { Locator, Page } from "@playwright/test";

type KonvaNode = {
  x: () => number;
  y: () => number;
  width: () => number;
  height: () => number;
  draggable: () => boolean;
  getParent: () => { getClassName: () => string };
  image: () => { src: string };
};
type KonvaStage = {
  container: () => HTMLElement;
  find: (selector: string) => KonvaNode[];
};
type KonvaWindow = { Konva: { stages: KonvaStage[] } };

export type Rect = { x: number; y: number; width: number; height: number };

// toolbar buttons have no label of their own: found by the icon MUI draws
export class TestDetailsDialog {
  drawAreas = this.page.getByTestId("drawArea");
  checkpointPane = this.drawAreas.nth(1);

  step = this.page.getByRole("heading", { name: /^Step \d+\/\d+:/ });
  closeBtn = this.iconButton("CloseIcon");

  drawMode = this.iconButton("AddIcon");
  deleteArea = this.iconButton("DeleteIcon");
  clearAreas = this.iconButton("LayersClearIcon");
  applyAreas = this.iconButton("CollectionsIcon");
  saveAreas = this.iconButton("SaveIcon");
  areaKind = this.page.locator("#area-select");

  zoomIn = this.iconButton("ZoomInIcon");
  zoomOut = this.iconButton("ZoomOutIcon");
  originalSize = this.iconButton("FullscreenIcon");
  fitToScreen = this.iconButton("FullscreenExitIcon");

  // by text: the tooltip wrapper makes "Hotkey: A" the name; anchored vs "Approve variations"
  approve = this.page.getByRole("button").filter({ hasText: /^Approve$/ });
  reject = this.page.getByRole("button").filter({ hasText: /^Reject$/ });
  approveVariations = this.page
    .getByRole("button")
    .filter({ hasText: /^Approve variations$/ });
  rejectVariations = this.page
    .getByRole("button")
    .filter({ hasText: /^Reject variations$/ });
  toggleDiff = this.page.getByRole("switch", { name: "Toggle diff" });

  commentsBtn = this.page.getByRole("button", { name: "Comments" });
  comment = this.page.getByTestId("comment");
  commentSaveBtn = this.page
    .getByRole("tooltip")
    .filter({ has: this.comment })
    .getByRole("button", { name: "Save" });
  // MUI's Fade sets opacity to 0 the moment it starts to close, 1 while open
  commentBox = this.page
    .getByRole("tooltip")
    .filter({ has: this.comment })
    .locator(".MuiPaper-root");

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

  discardPrompt = this.page.getByText("You have not saved ignore areas");

  constructor(public page: Page) {
    this.page = page;
  }

  variation(label: string): Locator {
    return this.variations.getByRole("checkbox", { name: label, exact: true });
  }

  variationsConfirm(verb: "Approve" | "Reject"): Locator {
    return this.variations.getByRole("button", {
      name: new RegExp(String.raw`^${verb} \d+ selected$`),
    });
  }

  private iconButton(icon: string): Locator {
    return this.page
      .getByRole("button")
      .filter({ has: this.page.getByTestId(icon) });
  }

  ignoreRects(): Promise<Rect[]> {
    return this.checkpointPane.evaluate((pane) => {
      const { Konva } = window as unknown as KonvaWindow;
      const stage = Konva.stages.find((s) => pane.contains(s.container()));

      return (
        stage
          .find("Rect")
          // the resize handles of a selected area are rects too
          .filter((rect) => rect.getParent().getClassName() !== "Transformer")
          // the areas applied at upload are drawn too, and cannot be moved
          .filter((rect) => rect.draggable())
          .map((rect) => ({
            x: rect.x(),
            y: rect.y(),
            width: rect.width(),
            height: rect.height(),
          }))
      );
    });
  }

  lockedRects(): Promise<Rect[]> {
    return this.checkpointPane.evaluate((pane) => {
      const { Konva } = window as unknown as KonvaWindow;
      const stage = Konva.stages.find((s) => pane.contains(s.container()));

      return stage
        .find("Rect")
        .filter((rect) => rect.getParent().getClassName() !== "Transformer")
        .filter((rect) => !rect.draggable())
        .map((rect) => ({
          x: rect.x(),
          y: rect.y(),
          width: rect.width(),
          height: rect.height(),
        }));
    });
  }

  hasSelection(): Promise<boolean> {
    return this.checkpointPane.evaluate((pane) => {
      const { Konva } = window as unknown as KonvaWindow;
      const stage = Konva.stages.find((s) => pane.contains(s.container()));

      return stage.find("Transformer").length > 0;
    });
  }

  async shownImage(): Promise<string> {
    const src = await this.checkpointPane.evaluate((pane) => {
      const { Konva } = window as unknown as KonvaWindow;
      const stage = Konva.stages.find((s) => pane.contains(s.container()));
      const images = stage.find("Image");

      return images.at(-1).image().src;
    });

    return src.split("/").pop() ?? "";
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

  private async checkpointCanvasBox() {
    return await this.checkpointPane.locator("canvas").first().boundingBox();
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
}
