import { Page } from "@playwright/test";
import { Project } from "~client/types";
import { getProjectsGetUrl } from "~client/services";
// import { API_URL } from "./data";

// export const mockGetProjects = async (page: Page, projects: Project[]) =>
//     page.route(getProjectsGetUrl(API_URL), route => route.fulfill({
//         body: JSON.stringify(projects)
//     }))
