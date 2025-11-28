describe('Login Correcto - MiniFit', () => {

  beforeEach(() => {
    cy.visit('http://localhost:4200/auth/login');
  });

  it('Debe permitir login correcto con credenciales válidas', () => {

    // Escribir RUT sin puntos ni guion (el input lo formatea automáticamente)
    cy.get('ion-input[formControlName="rut"] input')
      .clear()
      .type('212876119');

    // Validar que el input convierte el rut a formato correcto
    cy.get('ion-input[formControlName="rut"] input')
      .should('have.value', '21.287.611-9');

    // Escribir contraseña válida
    cy.get('ion-input[formControlName="password"] input')
      .clear()
      .type('Fernanda24*')
      .should('have.value', 'Fernanda24*');

    // Click en ingresar
    cy.contains('Ingresar').click({ force: true });

    // Esperar la navegación y validar URL correcta
    cy.url().should('include', '/inicio/selector-hijo');
  });

});
