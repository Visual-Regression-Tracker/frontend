/* global cy */
import { buildsService, projectsService, testRunService } from "../services";
import { Build, Project, TestRun } from "../types";

const projectStub = {
  getAll: (projects: Array<Project>) =>
    cy.stub(projectsService, "getAll").resolves(projects),
};

const buildsServiceStub = {
  getDetails: (build: Build) =>
    cy.stub(buildsService, "getDetails").resolves(build),
  getList: (builds: Array<Build>) =>
    cy.stub(buildsService, "getList").resolves({
      data: builds,
      total: 100,
      skip: 0,
      take: 10,
    }),
};

const testRunServiceStub = {
  getList: (testRuns: Array<TestRun>) =>
    cy.stub(testRunService, "getList").resolves(testRuns),
};

export { projectStub, buildsServiceStub, testRunServiceStub };
