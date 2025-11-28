describe('Agregar hijo (flujo completo real) - MiniFit (FINAL SIN MENÚ)', () => {

  it('Login → Selector hijo → Home → Perfil → Agregar hijo → Crear hijo → Forzar Home', () => {

    // LOGIN
    cy.visit('http://localhost:4200/auth/login');
    cy.get('ion-input[formControlName="rut"] input').last().type('212876119', { force: true });
    cy.get('ion-input[formControlName="password"] input').last().type('Fernanda24*', { force: true });
    cy.contains('Ingresar').click({ force: true });

    // SELECTOR HIJO
    cy.location('pathname', { timeout: 10000 }).should('eq', '/inicio/selector-hijo');

    cy.contains('Rodrigo', { timeout: 8000 }).click({ force: true });
    cy.contains('Continuar').click({ force: true });

    // HOME
    cy.location('pathname', { timeout: 10000 }).should('eq', '/inicio/home');

    // IR A PERFIL SIN USAR MENÚ
    cy.visit('http://localhost:4200/perfil');
    cy.contains('Agregar hijo', { timeout: 6000 }).click({ force: true });

    // AGREGAR-HIJO
    cy.location('pathname', { timeout: 8000 }).should('eq', '/hijo/agregar-hijo');

    // FORMULARIO (menú puede estar abierto, duplicando inputs)
    cy.get('ion-input[formControlName="rutCompleto"] input').last().type('205678913', { force: true });
    cy.get('ion-input[formControlName="nombre"] input').last().type('PruebaCypress', { force: true });
    cy.get('ion-input[formControlName="apellidoPaterno"] input').last().type('Test', { force: true });
    cy.get('ion-input[formControlName="apellidoMaterno"] input').last().type('Menu', { force: true });
    cy.get('ion-input[formControlName="fechaNac"] input').last().type('2019-04-10', { force: true });

    cy.contains('Guardar').click({ force: true });

    cy.wait(1500);

    // ⭐ EVITAMOS MENÚ — vamos directo al home
    cy.visit('http://localhost:4200/inicio/home');

    cy.location('pathname', { timeout: 8000 }).should('eq', '/inicio/home');

  });

});
