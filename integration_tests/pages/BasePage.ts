import { Page } from "@playwright/test";
import { Modal } from "./Modal";
import { Notification } from "./Notification";

export abstract class BasePage {
  modal: Modal;
  notification: Notification;

  constructor(public page: Page) {
    this.page = page;
    this.modal = new Modal(page);
    this.notification = new Notification(page);
  }
}
