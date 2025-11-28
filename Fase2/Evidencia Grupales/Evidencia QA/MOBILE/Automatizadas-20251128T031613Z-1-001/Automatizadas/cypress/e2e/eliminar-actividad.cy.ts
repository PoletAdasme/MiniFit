/// <reference types="cypress" />

describe('Eliminar actividad (final)', () => {

  it('Eliminar actividad desde el historial', () => {

    const rut = '212876119';
    const pass = 'Fernanda24*';

    // LOGIN
    cy.visit('http://localhost:4200/auth/login');
    cy.get('ion-input[formControlName="rut"] input').type(rut, { force: true });
    cy.get('ion-input[formControlName="password"] input').type(pass, { force: true });
    cy.contains('Ingresar').click({ force: true });

    cy.location('pathname', { timeout: 20000 })
      .should('include', '/inicio/selector-hijo');

    cy.contains('HijoTest').click({ force: true });
    cy.contains('Continuar').click({ force: true });


    // IR AL PANEL
    cy.visit('http://localhost:4200/panel/actividad?hijoId=6&hijo=HijoTest');

    // ESPERAR HISTORIAL
    cy.get('.historial-scroll ion-item', { timeout: 30000 })
      .should('have.length.at.least', 1);

    // =============================
    //  CLICK EN EL BOTÓN ELIMINAR
    // =============================
    cy.get('.historial-scroll ion-item')
      .first()
      .find('ion-button[color="danger"]')   // botón con ícono de eliminar
      .click({ force: true });

    // =============================
    //  CONFIRMAR EN EL ALERT
    // =============================
    cy.get('ion-alert button.alert-button', { timeout: 20000 })
      .contains('Eliminar')
      .click({ force: true });

    // VALIDAR QUE EL HISTORIAL SIGA EXISTIENDO
    cy.get('.historial-scroll ion-item', { timeout: 20000 })
      .should('exist');

  });

});
