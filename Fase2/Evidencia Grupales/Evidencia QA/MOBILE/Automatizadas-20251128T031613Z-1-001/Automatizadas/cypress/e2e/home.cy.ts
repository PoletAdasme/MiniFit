describe('Home - MiniFit (flujo real)', () => {

  it('Login real → Selector hijo → Seleccionar Rodrigo → Home → Validación total', () => {

    // ============================
    // 1) LOGIN REAL
    // ============================

    cy.visit('http://localhost:4200/auth/login');

    cy.get('ion-input[formControlName="rut"] input')
      .type('212876119')
      .blur();

    cy.get('ion-input[formControlName="password"] input')
      .type('Fernanda24*')
      .blur();

    cy.contains('Ingresar').click({ force: true });

    // Espera navegación al selector de hijo
    cy.location('pathname', { timeout: 12000 })
      .should('eq', '/inicio/selector-hijo');


    // ============================
    // 2) SELECTOR HIJO (DOS HIJOS)
    // ============================

    // Validar que carguen Rodrigo y Claudio
    cy.contains('Rodrigo', { timeout: 12000 }).should('exist');
    cy.contains('Claudio', { timeout: 12000 }).should('exist');

    // Seleccionar Rodrigo
    cy.contains('Rodrigo').click({ force: true });
    cy.wait(300);

    // Continuar
    cy.contains('Continuar')
      .should('not.be.disabled')
      .click({ force: true });


    // ============================
    // 3) HOME
    // ============================

    cy.location('pathname', { timeout: 12000 })
      .should('eq', '/inicio/home');

    // ============================
    // 4) VALIDACIONES DE CONTENIDO
    // ============================

    // Título principal
    cy.contains('Bienvenido', { timeout: 8000 }).should('exist');

    // Sección de datos del hijo activo
    cy.contains('Nombre completo:', { timeout: 8000 }).should('exist');
    cy.contains(/Edad:/).should('exist');
    cy.contains(/Fecha de Nacimiento:/).should('exist');

    // ============================
    // 5) ACCESOS RÁPIDOS
    // ============================
    cy.contains('Actividad física').should('exist');
    cy.contains('Comidas').should('exist');
    cy.contains('Mediciones').should('exist');


    // ============================
    // 6) CARRUSEL DE PRODUCTOS
    // ============================

    cy.contains('Grandes productos').should('exist');
    cy.contains('Ahorra en tu compra').should('exist');

    // Debe haber al menos 3 tarjetas
    cy.get('.cf-card').should('have.length.at.least', 3);

  });

});
