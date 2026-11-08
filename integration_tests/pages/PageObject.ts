import { Locator, Page } from "@playwright/test";

// a subclass's field initialisers run after this constructor, so they can use this.page
export abstract class PageObject {
  constructor(public page: Page) {}

  text(content: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.page.getByText(content, options);
  }
}
