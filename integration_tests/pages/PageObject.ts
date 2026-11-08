import { Locator, Page } from "@playwright/test";

// a subclass's field initialisers run after this constructor, so they can use this.page
export abstract class PageObject {
  constructor(public page: Page) {}

  get tooltip(): Locator {
    return this.page.getByRole("tooltip");
  }

  menuItem(name: string | RegExp): Locator {
    return this.page.getByRole("menuitem", { name });
  }

  get menu(): Locator {
    return this.page.getByRole("menu");
  }

  text(content: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.page.getByText(content, options);
  }
}
