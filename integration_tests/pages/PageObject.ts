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

  text(content: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.page.getByText(content, options);
  }
}
