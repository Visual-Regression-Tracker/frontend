import { Locator, Page } from "@playwright/test";

// a subclass's field initialisers run after this constructor, so they can use this.page
export abstract class PageObject {
  constructor(public page: Page) {}

  get options(): Locator {
    return this.page.getByRole("option");
  }

  get tooltip(): Locator {
    return this.page.getByRole("tooltip");
  }

  option(name: string | RegExp): Locator {
    return this.page.getByRole("option", { name });
  }

  menuItem(name: string | RegExp): Locator {
    return this.page.getByRole("menuitem", { name });
  }

  get listbox(): Locator {
    return this.page.getByRole("listbox");
  }

  get menu(): Locator {
    return this.page.getByRole("menu");
  }

  get menuItems(): Locator {
    return this.page.getByRole("menuitem");
  }

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

  text(content: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.page.getByText(content, options);
  }
}
