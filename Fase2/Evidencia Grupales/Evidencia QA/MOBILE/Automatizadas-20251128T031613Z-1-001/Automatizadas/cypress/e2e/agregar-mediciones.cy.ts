/// <reference types="cypress" />

describe('Agregar mediciones correctamente', () => {

  it('Debe agregar una medición', () => {

    // =========================================
    // =============== LOGIN ====================
    // =========================================
    const rut = '212876119';
    const pass = 'Fernanda24*';

    cy.visit('http://localhost:4200/auth/login');

    cy.get('ion-input[formControlName="rut"] input')
      .type(rut, { force: true });

    cy.get('ion-input[formControlName="password"] input')
      .type(pass, { force: true });

    cy.contains('Ingresar').click({ force: true });


    // =========================================
    // =========== SELECTOR HIJO ===============
    // =========================================
    cy.location('pathname', { timeout: 10000 })
      .should('include', '/inicio/selector-hijo');

    cy.contains('HijoTest').click({ force: true });
    cy.contains('Continuar').click({ force: true });


    // =========================================
    // ======== NAVEGAR A MEDICIONES ===========
    // =========================================
    cy.visit('http://localhost:4200/panel/mediciones/agregar?hijoId=40&hijo=HijoTest');


    // =========================================
    // =========== VALIDAR FORM =================
    // =========================================
    cy.get('ion-input[formControlName="fecha"] input', { timeout: 6000 })
      .should('exist');

    // =========================================
    // ======== INGRESAR DATOS ==================
    // =========================================

    // Fecha (se mantiene default, pero la limpiamos para asegurar)
    cy.get('ion-input[formControlName="fecha"] input')
      .clear({ force: true })
      .type('2025-01-01', { force: true });

    // Peso
    cy.get('ion-input[formControlName="pesoKg"] input')
      .clear({ force: true })
      .type('70', { force: true });

    // Estatura
    cy.get('ion-input[formControlName="estaturaCm"] input')
      .clear({ force: true })
      .type('175', { force: true });

    // Validar IMC preview
    cy.contains('IMC (estimado):')
      .should('exist');

    // =========================================
    // =============== GUARDAR ==================
    // =========================================
    cy.contains('Guardar', { timeout: 8000 })
      .click({ force: true });


    // =========================================
    // ============= VALIDAR TOAST =============
    // =========================================
    cy.get('ion-toast', { timeout: 10000 })
      .should('exist')
      .shadow()
      .find('.toast-container')
      .should('contain.text', 'Medición guardada');


    // =========================================
    // ========= VALIDAR REDIRECCIÓN ============
    // =========================================
    cy.location('pathname', { timeout: 8000 })
      .should('include', '/panel/mediciones');

  });

});
