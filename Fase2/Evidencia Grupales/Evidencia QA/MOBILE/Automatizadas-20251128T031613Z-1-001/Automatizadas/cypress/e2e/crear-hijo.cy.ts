/// <reference types="cypress" />

describe('Crear Hijo - MiniFit (flujo real)', () => {

  it('Login real → Crear hijo → Guardar → Selector hijo / Home', () => {

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
    // IR A CREAR HIJO
    // ============================

    cy.visit('http://localhost:4200/inicio/crear-hijo');


    // ============================
    // LLENAR FORMULARIO
    // ============================

    // RUT válido y NO registrado
    cy.get('ion-input[formControlName="rutCompleto"] input')
      .type('184674785')
      .blur();

    cy.get('ion-input[formControlName="nombre"] input')
      .type('HijoTest')
      .blur();

    cy.get('ion-input[formControlName="apellidoPaterno"] input')
      .type('Cypress')
      .blur();

    cy.get('ion-input[formControlName="apellidoMaterno"] input')
      .type('Tester')
      .blur();

    // FECHA DE NACIMIENTO válida (4 años)
    const hoy = new Date();
    const fechaOK = new Date(
      hoy.getFullYear() - 4,
      hoy.getMonth(),
      hoy.getDate()
    ).toISOString().slice(0, 10);

    cy.get('ion-input[formControlName="fechaNac"] input')
      .type(fechaOK)
      .blur();

    cy.wait(300);


    // ============================
    // GUARDAR
    // ============================

    cy.contains('Guardar')
      .should('not.be.disabled')
      .click({ force: true });


    // ============================
    // REDIRECCIÓN POST-GUARDAR
    // ============================

    cy.location('pathname', { timeout: 12000 })
      .should('match', /\/inicio\/(home|selector-hijo)/);


    // ============================
    // VALIDAR QUE EL HIJO APARECE
    // ============================

    cy.contains('HijoTest', { timeout: 15000 })
      .should('exist');

  });

});
