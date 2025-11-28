/// <reference types="cypress" />

describe('Editar comida correctamente (versión FINAL)', () => {

  it('Editar comida con API lenta y botón Buscar real', () => {

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


    // EDITAR PRIMERA COMIDA
    cy.get('.historial-scroll ion-item')
      .first()
      .find('ion-button')
      .contains('Editar')
      .click({ force: true });

    cy.get('ion-select[formControlName="idTipoComida"]', { timeout: 20000 })
      .should('exist');


    // CAMBIAR TIPO
    cy.get('ion-select[formControlName="idTipoComida"]').click({ force: true });
    cy.get('ion-radio-group', { timeout: 20000 })
      .find('ion-item')
      .contains('Cena')
      .click({ force: true });


    // BUSCAR PRODUCTO
    cy.get('ion-input[formControlName="termino"] input')
      .clear({ force: true })
      .type('manzana', { force: true });

    // 👇 BOTÓN REAL CON ID = 12 (IGUAL QUE EN AGREGAR)
    cy.get('#12', { timeout: 15000 })
      .should('be.visible')
      .click({ force: true });

    // Esperar resultados reales
    cy.get('ion-list.resultados-scroll ion-item', { timeout: 85000 })
      .should('have.length.at.least', 1);


    // AGREGAR PRODUCTO
    cy.get('ion-list.resultados-scroll ion-item')
      .first()
      .find('ion-button')
      .contains('Agregar', { timeout: 85000 })
      .click({ force: true }, );

    cy.wait(20000);


    // GUARDAR
    cy.contains('Actualizar')
      .scrollIntoView()
      .click({ force: true });


    cy.location('pathname', { timeout: 20000 })
      .should('include', '/panel/comidas');

  });

});
