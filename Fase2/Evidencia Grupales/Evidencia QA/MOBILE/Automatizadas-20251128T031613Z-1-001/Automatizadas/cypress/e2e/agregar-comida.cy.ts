/// <reference types="cypress" />

describe('Debe agregar una comida correctamente', () => {

  it('Agregar comida', () => {

    const rut = '212876119';
    const pass = 'Fernanda24*';

    cy.visit('http://localhost:4200/auth/login');

    cy.get('ion-input[formControlName="rut"] input').type(rut, { force: true });
    cy.get('ion-input[formControlName="password"] input').type(pass, { force: true });
    cy.contains('Ingresar').click({ force: true });

    cy.location('pathname', { timeout: 12000 }).should('include', '/inicio/selector-hijo');
    cy.contains('HijoTest').click({ force: true });
    cy.contains('Continuar').click({ force: true });

    cy.visit('http://localhost:4200/panel/comidas?hijoId=40&hijo=HijoTest');


    // ⭐ INTERCEPT CORRECTO ⭐
    cy.intercept('GET', '**/api/off/buscar**').as('buscarComida');


    cy.contains('Agregar comida').click({ force: true });

    // Tipo comida
    cy.get('ion-select[formControlName="idTipoComida"]').click({ force: true });
    cy.get('ion-radio-group', { timeout: 8000 })
      .contains('Desayuno')
      .click({ force: true });

    // Buscar
    cy.get('ion-input[formControlName="termino"] input')
      .clear({ force: true })
      .type('yogurt', { force: true });

    cy.get('#12').should('be.visible').click({ force: true });

    // Esperar API REAL (OpenFoodFacts)
    cy.wait('@buscarComida', { timeout: 30000 })
      .its('response.statusCode')
      .should('eq', 200);

    cy.get('ion-list.resultados-scroll ion-item', { timeout: 15000 })
      .should('have.length.at.least', 1);

    cy.get('ion-list.resultados-scroll ion-item')
      .first()
      .find('ion-button')
      .contains('Agregar')
      .click({ force: true });

    cy.contains('Guardar', { timeout: 10000 })
      .click({ force: true });

    cy.location('pathname', { timeout: 10000 })
      .should('include', '/panel/comidas');

  });

});
