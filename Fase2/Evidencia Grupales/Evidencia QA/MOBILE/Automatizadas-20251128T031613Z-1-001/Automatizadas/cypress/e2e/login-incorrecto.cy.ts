describe('Login - MiniFit', () => {

  beforeEach(() => {
    cy.visit('http://localhost:4200/auth/login');
  });

  it('Debe mostrar el formulario de login', () => {
    cy.contains('RUT').should('be.visible');
    cy.contains('Contraseña').should('be.visible');

    cy.get('ion-input[formControlName="rut"]').should('exist');
    cy.get('ion-input[formControlName="password"]').should('exist');
    cy.get('ion-button[type="submit"]').should('exist');
  });

  it('El botón debe estar deshabilitado con el formulario vacío', () => {
    cy.get('ion-button[type="submit"]')
      .should('have.attr', 'disabled');
  });

  it('Debe permitir escribir RUT y contraseña', () => {
    cy.get('ion-input[formControlName="rut"] input')
      .type('12.345.678-9')
      .should('have.value', '12.345.678-9');

    cy.get('ion-input[formControlName="password"] input')
      .type('Abc123!')
      .should('have.value', 'Abc123!');
  });

  it('Debe habilitar el botón cuando el formulario es válido', () => {
    cy.get('ion-input[formControlName="rut"] input').type('12.345.678-9');
    cy.get('ion-input[formControlName="password"] input').type('Abc123!');

    cy.get('ion-button[type="submit"]').should('not.have.attr', 'disabled');
  });

});
