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

type StageSnapshot = {
  rects: (Rect & { draggable: boolean })[];
  hasTransformer: boolean;
  imageSrc: string | null;
};

export class ImagePanes extends PageObject {
  drawAreas = this.page.getByTestId(TEST_ID.drawArea);
  firstPane = this.drawAreas.first();
  canvases = this.drawAreas.locator("canvas");
  checkpointPane = this.drawAreas.nth(1);
  lastCanvas = this.canvases.last();
  imageSize = this.page.getByTestId(TEST_ID.imageSize);

  async ignoreRects(): Promise<Rect[]> {
    return this.rects(true);
  }

  async lockedRects(): Promise<Rect[]> {
    return this.rects(false);
  }

  private async rects(draggable: boolean): Promise<Rect[]> {
    const { rects } = await this.stage();

    return rects
      .filter((rect) => rect.draggable === draggable)
      .map(({ x, y, width, height }) => ({ x, y, width, height }));
  }

  async hasSelection(): Promise<boolean> {
    return (await this.stage()).hasTransformer;
  }

  async shownImage(): Promise<string> {
    const { imageSrc } = await this.stage();
    if (!imageSrc) throw new Error("No image in the checkpoint pane");

    return imageSrc.split("/").pop() ?? "";
  }

  private async stage(): Promise<StageSnapshot> {
    const snapshot = await this.checkpointPane.evaluate((pane) => {
      const { Konva } = window as unknown as KonvaWindow;
      const stage = Konva.stages.find((s) => pane.contains(s.container()));
      if (!stage) return null;

      const image = stage.find("Image").at(-1)?.image();

      return {
        rects: stage
          .find("Rect")
          // the resize handles of a selected area are rects too
          .filter((rect) => rect.getParent().getClassName() !== "Transformer")
          .map((rect) => ({
            x: rect.x(),
            y: rect.y(),
            width: rect.width(),
            height: rect.height(),
            draggable: rect.draggable(),
          })),
        hasTransformer: stage.find("Transformer").length > 0,
        imageSrc: image?.src ?? null,
      };
    });
    if (!snapshot) throw new Error("No Konva stage in the checkpoint pane");

    return snapshot;
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
}
