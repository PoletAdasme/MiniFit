// cypress/e2e/eliminar-hijo.cy.ts

describe('Eliminar hijo - MiniFit (FINAL)', () => {

  it('Login → Selector hijo → Home → Perfil → Eliminar PruebaCypress', () => {

    // LOGIN
    cy.visit('http://localhost:4200/auth/login');

    cy.get('ion-input[formControlName="rut"] input')
      .type('21287611-9', { force: true });

    cy.get('ion-input[formControlName="password"] input')
      .type('Fernanda24*', { force: true });

    cy.contains('Ingresar').click({ force: true });

    cy.location('pathname', { timeout: 20000 })
      .should('include', '/inicio/selector-hijo');

    // SELECCIONAR HIJO
    cy.contains('Rodrigo', { timeout: 20000 })
      .click({ force: true });

    cy.contains('Continuar').click({ force: true });

    // ⭐ IMPORTANTE: ir a HOME primero
    cy.location('pathname', { timeout: 20000 })
      .should('include', '/inicio/home');

    // AHORA SÍ → ir al perfil
    cy.contains('Perfil').click({ force: true });

    // VALIDAR QUE CARGARON LOS HIJOS
    cy.get('ion-item-sliding', { timeout: 20000 })
      .should('have.length.at.least', 1);

    // UBICAR EL HIJO A ELIMINAR
    cy.contains('ion-item', 'HijoTest2')
      .parents('ion-item-sliding')
      .within(() => {
        cy.get('ion-button[color="danger"]').click({ force: true });
      });

    // ACEPTAR ALERTA
    cy.get('ion-alert', { timeout: 15000 })
      .find('button.alert-button')
      .contains('Eliminar')
      .click({ force: true });



  });

});
