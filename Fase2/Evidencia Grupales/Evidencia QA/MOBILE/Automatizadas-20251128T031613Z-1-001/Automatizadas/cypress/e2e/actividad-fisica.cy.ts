it('Diagnóstico → Ver por qué redirige al selector', () => {

  const rut = '212876119';
  const pass = 'Fernanda24*';

  cy.visit('http://localhost:4200/auth/login');

  cy.get('ion-input[formControlName="rut"] input')
    .last()
    .type(rut, { force: true });

  cy.get('ion-input[formControlName="password"] input')
    .last()
    .type(pass, { force: true });

  cy.contains('Ingresar').click({ force: true });

  cy.location('pathname')
    .should('include', '/inicio/selector-hijo');

  cy.contains('Rodrigo').click({ force: true });
  cy.contains('Continuar').click({ force: true });

  cy.location('pathname').should('eq', '/inicio/home');

  // 🔍 Esperar la carga de hijos/mis ANTES de presionar Actividad física
  cy.intercept('GET', '**/api/Hijos/mis').as('cargarHijos');
  cy.wait('@cargarHijos');

  cy.pause(); // <<< DETENCIÓN MANUAL

  cy.contains('Actividad física').click({ force: true });

  cy.location().then(loc => {
    cy.log('URL final:', loc.href);
  });

});
