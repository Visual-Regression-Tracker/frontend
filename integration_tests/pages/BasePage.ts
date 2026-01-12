import { Page } from "@playwright/test";
import { Header } from "./Header";
import { Modal } from "./Modal";
import { Notification } from "./Notification";

export abstract class BasePage {
  header: Header;
  modal: Modal;
  notification: Notification;

  constructor(public page: Page) {
    this.page = page;
    this.header = new Header(page);
    this.modal = new Modal(page);
    this.notification = new Notification(page);
  }
}
