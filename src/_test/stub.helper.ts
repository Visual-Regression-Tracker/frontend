/* global cy */
import { buildsService, projectsService, testRunService } from "../services";
import { Build, Project, TestRun } from "../types";

const projectStub = {
  getAll: (projects: Project[]) =>
    cy.stub(projectsService, "getAll").resolves(projects),
};

const buildsServiceStub = {
  getDetails: (build: Build) =>
    cy.stub(buildsService, "getDetails").resolves(build),
  getList: (builds: Build[]) =>
    cy.stub(buildsService, "getList").resolves({
      data: builds,
      total: 100,
      skip: 0,
      take: 10,
    }),
};

const testRunServiceStub = {
  getList: (testRuns: TestRun[]) =>
    cy
      .stub(testRunService, "getList")
      .resolves({ data: testRuns, total: 100, skip: 0, take: 10 }),
};

export { projectStub, buildsServiceStub, testRunServiceStub };
