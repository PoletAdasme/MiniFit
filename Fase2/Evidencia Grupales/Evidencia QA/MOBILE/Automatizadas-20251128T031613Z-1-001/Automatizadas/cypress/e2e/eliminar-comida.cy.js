/// <reference types="cypress" />

describe('Eliminar comida correctamente (FIX DOBLE CLICK)', () => {

  beforeEach(() => {
    cy.viewport(1280, 900);
  });

  it('Debe eliminar una comida sin doble apertura', () => {

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


    // PANEL COMIDAS
    cy.visit('http://localhost:4200/panel/comidas?hijoId=40&hijo=HijoTest');

    cy.get('.historial-scroll ion-item', { timeout: 30000 })
      .should('have.length.at.least', 1);


    // ============================
    // OBTENER TEXTO DEL ITEM
    // ============================
    cy.get('.historial-scroll ion-item')
      .first()
      .invoke('text')
      .then((textoOriginal) => {

        // ============================
        // ESPERAR ESTABILIDAD DEL ITEM
        // (evita doble click)
        // ============================
        cy.wait(300);  // <-- tiempo clave para que Ionic termine animación o render

        // ============================
        // CLICK EN EL BOTÓN ELIMINAR
        // ============================
        cy.get('.historial-scroll ion-item')
          .first()
          .scrollIntoView()
          .within(() => {

            cy.wait(200); // <-- evita doble apertura

            cy.get('ion-button')
              .filter((i, btn) => btn.textContent.includes('Eliminar'))
              .should('be.visible')
              .click({ force: true });

          });

        // ============================
        // ESPERAR PROCESO DE ELIMINACIÓN
        // ============================
        cy.wait(800); // <-- crítico: deja que Angular/Ionic actualicen DOM

        // ============================
        // VALIDAR QUE EL ITEM YA NO ESTÁ
        // ============================
        cy.get('.historial-scroll ion-item', { timeout: 10000 })
          .should('not.contain.text', textoOriginal);

      });

  });

});
