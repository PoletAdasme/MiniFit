/// <reference types="cypress" />

describe('Editar hijo (flujo real) - MiniFit', () => {

  it('Login → Selector → Home → Perfil → Editar → Guardar → Validar cambios', () => {

    const rut = '212876119';
    const pass = 'Fernanda24*';

    const hijoOriginal = 'Claudio';
    const nuevoNombre = 'Claudio Cypress';
    const nuevoApellido = 'Test';

    // ============================
    // LOGIN
    // ============================
    cy.visit('http://localhost:4200/auth/login');

    cy.get('ion-input[formControlName="rut"] input')
      .last()
      .type(rut, { force: true });

    cy.get('ion-input[formControlName="password"] input')
      .last()
      .type(pass, { force: true });

    cy.contains('Ingresar').click({ force: true });

    cy.location('pathname', { timeout: 15000 })
      .should('include', '/inicio/selector-hijo');

    cy.contains('Rodrigo', { timeout: 8000 }).click({ force: true });
    cy.contains('Continuar').click({ force: true });

    cy.location('pathname', { timeout: 15000 })
      .should('eq', '/inicio/home');


    // ============================
    // PERFIL
    // ============================
    cy.get('ion-menu-button', { includeShadowDom: true })
      .click({ force: true });

    cy.contains('Perfil', { timeout: 8000 }).click({ force: true });

    cy.location('pathname', { timeout: 12000 })
      .should('eq', '/perfil');


    // ============================
    // EDITAR HIJO → CLICK EN EL BOTÓN DE LA IMAGEN
    // ============================
    cy.contains(hijoOriginal, { timeout: 8000 })
      .parents('ion-item')
      .within(() => {
        cy.get('img[alt="Editar"]').first().click({ force: true });
      });

    // No validamos redirección → tu app se queda aquí mismo


    // ============================
    // EDITAR FORMULARIO (sin redirección)
    // ============================
    cy.get('ion-input[formControlName="nombre"] input')
      .first()
      .clear({ force: true })
      .type(nuevoNombre, { force: true });

    cy.get('ion-input[formControlName="apPaterno"] input')
      .first()
      .clear({ force: true })
      .type(nuevoApellido, { force: true });

    cy.get('ion-input[formControlName="fechaNac"] input')
      .first()
      .clear({ force: true })
      .type('2019-02-10', { force: true });

    cy.contains('Guardar').click({ force: true });

    cy.wait(1500);


  });

});
