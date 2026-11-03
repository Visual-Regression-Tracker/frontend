import { Page } from "@playwright/test";
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
}
