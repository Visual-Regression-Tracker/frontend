// https://docs.cypress.io/guides/component-testing/react/api
import {mount} from 'cypress/react';
import {addVrtTrackCommand, addVrtStartCommand, addVrtStopCommand} from "@visual-regression-tracker/agent-cypress/dist/commands";

addVrtStartCommand();
addVrtStopCommand();
addVrtTrackCommand();

before(() => {
    cy.vrtStart();
});

after(() => {
    cy.vrtStop();
});


// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
    namespace Cypress {
        interface Chainable {
            mount: typeof mount
        }
    }
}

Cypress.Commands.add('mount', mount)

// Example use:
// cy.mount(<MyComponent />)
