/// <reference types="cypress" />

describe('Editar medición correctamente (final)', () => {

  it('Editar medición existente', () => {

    const rut = '212876119';
    const pass = 'Fernanda24*';

    // ============================
    // LOGIN
    // ============================
    cy.visit('http://localhost:4200/auth/login');

    cy.get('ion-input[formControlName="rut"] input').type(rut, { force: true });
    cy.get('ion-input[formControlName="password"] input').type(pass, { force: true });
    cy.contains('Ingresar').click({ force: true });

    cy.location('pathname', { timeout: 20000 })
      .should('include', '/inicio/selector-hijo');

    cy.contains('HijoTest').click({ force: true });
    cy.contains('Continuar').click({ force: true });


    // ============================
    // PANEL MEDICIONES
    // ============================
    cy.visit('http://localhost:4200/panel/mediciones?hijoId=40&hijo=HijoTest');

    cy.get('.historial-scroll ion-item', { timeout: 20000 })
      .should('have.length.at.least', 1);

    cy.get('.historial-scroll ion-item')
      .first()
      .find('ion-button')
      .first()
      .click({ force: true });


    // ============================
    // CAMPOS (solo type=number)
    // ============================
    cy.get('ion-input[type="number"]:visible input', { timeout: 20000 })
      .should('have.length', 2)     // peso y estatura
      .then(($inputs) => {

        // PESO
        cy.wrap($inputs[0])
          .clear({ force: true })
          .type('25', { force: true });

        // ESTATURA
        cy.wrap($inputs[1])
          .clear({ force: true })
          .type('100', { force: true });
      });

    cy.wait(400);

    // ============================
    // GUARDAR
    // ============================
    cy.contains('Guardar')
      .scrollIntoView()
      .click({ force: true });

    // ============================
    // REDIRECCIÓN
    // ============================
    cy.location('pathname', { timeout: 20000 })
      .should('include', '/panel/mediciones');

  });

});
