/// <reference types="cypress" />

describe('Debe eliminar una medición correctamente', () => {

  it('Eliminar medición desde el dashboard', () => {

    // LOGIN
    const rut = '212876119';
    const pass = 'Fernanda24*';

    cy.visit('http://localhost:4200/auth/login');
    cy.get('ion-input[formControlName="rut"] input').type(rut, { force: true });
    cy.get('ion-input[formControlName="password"] input').type(pass, { force: true });
    cy.contains('Ingresar').click({ force: true });

    // Selector hijo
    cy.location('pathname', { timeout: 10000 })
      .should('include', '/inicio/selector-hijo');

    cy.contains('HijoTest').click({ force: true });
    cy.contains('Continuar').click({ force: true });

    // Dashboard mediciones
    cy.visit('http://localhost:4200/panel/mediciones?hijoId=40&hijo=HijoTest');

    // Espera historial
    cy.get('.historial-scroll ion-item', { timeout: 15000 })
      .should('have.length.at.least', 1);

    cy.get('.historial-scroll ion-item')
      .its('length')
      .then((countInicial) => {

        // Click en eliminar (segundo botón)
        cy.get('.historial-scroll ion-item')
          .first()
          .find('ion-button')
          .last()
          .click({ force: true });

        // Espera alert (sin shadow)
        cy.get('ion-alert', { timeout: 10000 })
          .should('exist')
          .within(() => {
            cy.contains('button.alert-button', 'Eliminar')
              .click({ force: true });
          });

        // Toast
        cy.get('ion-toast', { timeout: 10000 })
          .should('exist')
          .shadow()
          .find('.toast-container')
          .should('contain.text', 'Eliminado');

        // Esperar recarga
        cy.wait(1000);


      });

  });

});
