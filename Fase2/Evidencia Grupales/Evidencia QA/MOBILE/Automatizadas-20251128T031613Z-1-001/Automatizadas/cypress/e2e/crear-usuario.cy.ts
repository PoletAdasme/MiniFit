describe('Crear Usuario - MiniFit', () => {

  beforeEach(() => {
    cy.visit('http://localhost:4200/auth/crear-usuario');
  });

  it('Debe cargar correctamente la página', () => {
    cy.contains('Crear cuenta').should('exist');
  });

  it('Debe mostrar error si el RUT es inválido', () => {
    cy.get('ion-input[formControlName="rut"] input')
      .clear()
      .type('123456789')
      .blur();

    cy.contains('RUT inválido').should('exist');
  });



  it('Debe permitir solo dígitos en teléfono', () => {
    cy.get('ion-input[formControlName="telefono"] input')
      .type('9A1B2C')
      .should('have.value', '912');
  });

  it('Debe mostrar error cuando las contraseñas no coinciden', () => {

    cy.get('ion-input[formControlName="clave"] input').type('Test123*').blur();
    cy.get('ion-input[formControlName="confirmar"] input').type('Otro999*').blur();

    cy.contains('Las contraseñas no coinciden').should('exist');
  });


it('Debe crear usuario y redirigir al login (submit directo del form)', () => {

  cy.intercept('POST', '**/api/Usuarios', {
    statusCode: 200,
    body: {}
  });

  cy.get('ion-input[formControlName="rut"] input').type('212876119').blur();
  cy.get('ion-input[formControlName="nombre"] input').type('Pedro').blur();
  cy.get('ion-input[formControlName="apPaterno"] input').type('Gonzalez').blur();
  cy.get('ion-input[formControlName="apMaterno"] input').type('Mora').blur();
  cy.get('ion-input[formControlName="correo"] input').type('correo@test.cl').blur();
  cy.get('ion-input[formControlName="telefono"] input').type('91234567').blur();
  cy.get('ion-input[formControlName="clave"] input').type('Prueba12*').blur();
  cy.get('ion-input[formControlName="confirmar"] input').type('Prueba12*').blur();

  cy.wait(200); // Angular change detection

  // 🔥 Enviar el formulario directamente (solución definitiva)
  cy.get('form').submit();

  // 🔥 Validar navegación
  cy.location('pathname', { timeout: 10000 })
    .should('eq', '/auth/login');
});

});
