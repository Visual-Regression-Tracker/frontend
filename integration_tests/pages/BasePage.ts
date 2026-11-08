import { Locator, Page } from "@playwright/test";
import { Header } from "./Header";
import { Modal } from "./Modal";
import { Notification } from "./Notification";
import { PageObject } from "./PageObject";

export abstract class BasePage extends PageObject {
  header: Header;
  modal: Modal;
  notification: Notification;

  constructor(page: Page) {
    super(page);
    this.header = new Header(page);
    this.modal = new Modal(page);
    this.notification = new Notification(page);
  }

  fieldError(message: string): Locator {
    return this.text(message);
  }

  backgroundColor(): Promise<string> {
    return this.page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
  }

  heading = this.page.getByRole("heading", { level: 1 });

  get main(): Locator {
    return this.page.getByRole("main");
  }

  scrollMainToTop(): Promise<void> {
    return this.main.evaluate((main) => main.scrollTo(0, 0));
  }

  mainScrollTop(): Promise<number> {
    return this.main.evaluate((main) => main.scrollTop);
  }

  mainOverflow(): Promise<number> {
    return this.main.evaluate((main) => main.scrollHeight - main.clientHeight);
  }

  async growViewportBy(height: number): Promise<void> {
    const size = this.page.viewportSize() ?? { width: 1280, height: 720 };
    await this.page.setViewportSize({
      width: size.width,
      height: size.height + height,
    });
  }

  reload() {
    return this.page.reload();
  }

  // routes load lazily: before the heading renders a screenshot shows an empty page
  async waitUntilLoaded(): Promise<void> {
    await this.heading.waitFor();
    await this.page.waitForLoadState("networkidle");
  }
}
