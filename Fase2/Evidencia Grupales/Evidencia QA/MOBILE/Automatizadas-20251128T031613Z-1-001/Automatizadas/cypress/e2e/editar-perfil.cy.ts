/// <reference types="cypress" />

describe('Editar Perfil del Padre (flujo real completo) - MiniFit', () => {

  it('Login → Selector → Home → Perfil → Editar → Guardar → Validar', () => {

    const rut = '212876119';
    const pass = 'Fernanda24*';

    const nuevoNombre = 'Padre Cypress Editado';
    const nuevoCorreo = 'padre.cypress@test.com'; // siempre válido
    const nuevoTelefono = '987654321';

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


    // ============================
    // SELECCIONAR HIJO
    // ============================
    cy.contains('Rodrigo', { timeout: 8000 })
      .click({ force: true });

    cy.contains('Continuar')
      .click({ force: true });

    cy.location('pathname', { timeout: 15000 })
      .should('eq', '/inicio/home');


    // ============================
    // IR A PERFIL
    // ============================
    cy.get('ion-menu-button', { includeShadowDom: true })
      .click({ force: true });

    cy.contains('Perfil', { timeout: 8000 })
      .click({ force: true });

    cy.location('pathname', { timeout: 12000 })
      .should('eq', '/perfil');


    // ============================
    // EDITAR FORMULARIO DEL PADRE
    // ============================

    // Nombre (validación real)
    cy.get('ion-input[formControlName="nombre"] input')
      .clear({ force: true })
      .type(nuevoNombre, { force: true });

    // Correo (debe ser válido siempre)
    cy.get('ion-input[formControlName="correo"] input')
      .clear({ force: true })
      .type(nuevoCorreo, { force: true });

    // Teléfono
    cy.get('ion-input[formControlName="telefono"] input')
      .clear({ force: true })
      .type(nuevoTelefono, { force: true });


    // ============================
    // GUARDAR CAMBIOS
    // ============================
    cy.contains('Guardar cambios')
      .should('not.be.disabled')
      .click({ force: true });


  });

});
