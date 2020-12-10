/* global cy */
import { projectsService } from "../services";
import { Project } from "../types";

const projectStub = {
  getAll: (projects: Project[]) =>
    cy.stub(projectsService, "getAll").resolves(projects),
};

export { projectStub };
