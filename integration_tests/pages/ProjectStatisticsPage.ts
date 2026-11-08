import { BasePage } from "./BasePage";

export class ProjectStatisticsPage extends BasePage {
  bars = this.page.getByRole("list", { name: "Results per build" });
  bar = (name: string | RegExp) => this.bars.getByRole("link", { name });
  links = this.bars.getByRole("link");
  branchSelect = this.page.getByRole("combobox", { name: "Branch" });
}
