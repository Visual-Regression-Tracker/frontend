import { BasePage } from "./BasePage";

export class ProjectStatisticsPage extends BasePage {
  heading = this.page.getByRole("heading", { name: "Statistics", level: 1 });
  bars = this.page.getByRole("list", { name: "Results per build" });
  bar = (name: string | RegExp) => this.bars.getByRole("link", { name });
  branchSelect = this.page.getByRole("combobox", { name: "Branch" });
}
