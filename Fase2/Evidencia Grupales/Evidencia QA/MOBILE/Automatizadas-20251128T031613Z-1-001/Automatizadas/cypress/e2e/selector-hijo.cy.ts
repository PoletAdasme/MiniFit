describe('Selector de hijo con usuario real - MiniFit', () => {

  it('Login real → Selector hijo (2 hijos) → Seleccionar Rodrigo → Continuar → Home', () => {

    // ============================
    // LOGIN REAL
    // ============================

    cy.visit('http://localhost:4200/auth/login');

    cy.get('ion-input[formControlName="rut"] input')
      .type('212876119')
      .blur();

    cy.get('ion-input[formControlName="password"] input')
      .type('Fernanda24*')
      .blur();

    cy.contains('Ingresar').click({ force: true });

    cy.location('pathname', { timeout: 12000 })
      .should('eq', '/inicio/selector-hijo');

    // ============================
    // VALIDAR QUE CARGAN LOS DOS HIJOS
    // ============================

    cy.contains('Rodrigo', { timeout: 12000 }).should('exist');
    cy.contains('Claudio', { timeout: 12000 }).should('exist');

    // ============================
    // SELECCIONAR A RODRIGO
    // ============================

    cy.contains('Rodrigo').click({ force: true });  // selecciona item
    cy.wait(300); // deja que Ionic actualice ion-radio-group

    // ============================
    // PRESIONAR CONTINUAR
    // ============================

    cy.contains('Continuar')
      .should('not.be.disabled')
      .click({ force: true });

    // ============================
    // NAVEGAR AL HOME
    // ============================

    cy.location('pathname', { timeout: 12000 })
      .should('eq', '/inicio/home');
  });

});
