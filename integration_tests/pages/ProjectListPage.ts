import { BasePage } from "./BasePage";

export class ProjectListPage extends BasePage {
    projects = this.page.locator('#projectlist-1');
    deleteBtn = this.page.getByTestId('delete');
}