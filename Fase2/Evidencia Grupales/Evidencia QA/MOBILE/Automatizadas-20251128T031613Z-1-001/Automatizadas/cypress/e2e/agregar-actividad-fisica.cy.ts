/// <reference types="cypress" />

describe('Agregar Actividad Física sin pelear con el popup del select', () => {

  it('Login → Selector → PanelActividad → Agregar → Setear select por código → Guardar', () => {

    const rut = '212876119';
    const pass = 'Fernanda24*';

    const fecha = '2024-10-12';
    const minutos = '20';

    // =============================
    // 1) OBTENER UN TIPO DE EJERCICIO VÁLIDO DESDE LA API
    // =============================
    cy.request('GET', 'http://localhost:5074/api/TiposEjercicios')
      .then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an('array').and.not.be.empty;

        const tipo = resp.body[0]; // tomamos el primero
        const tipoId = tipo.idTipoEjercicios;

        cy.wrap(tipoId).as('tipoId');
      });

    // =============================
    // 2) LOGIN
    // =============================
    cy.visit('http://localhost:4200/auth/login');

    cy.get('ion-input[formControlName="rut"] input').last().type(rut, { force: true });
    cy.get('ion-input[formControlName="password"] input').last().type(pass, { force: true });

    cy.contains('Ingresar').click({ force: true });

    cy.location('pathname').should('include', '/inicio/selector-hijo');

    // =============================
    // 3) SELECCIONAR HIJO
    // =============================
    cy.contains('HijoTest', { timeout: 8000 }).click({ force: true });
    cy.contains('Continuar').click({ force: true });

    cy.location('pathname').should('eq', '/inicio/home');

    // =============================
    // 4) IR DIRECTO A PANEL ACTIVIDAD CON hijoId EN LA URL
    // =============================
    const hijoId = 40; // usa el que corresponda en tu BD

    cy.visit(`http://localhost:4200/panel/actividad?hijoId=${hijoId}`);

    cy.location('pathname').should('include', '/panel/actividad');

    // =============================
    // 5) ABRIR FORMULARIO "AGREGAR ACTIVIDAD"
    // =============================
    cy.contains('Agregar actividad', { timeout: 8000 }).click({ force: true });

    cy.location('pathname').should('include', '/panel/actividad/agregar');

    // =============================
    // 6) LLENAR FECHA Y MINUTOS NORMAL
    // =============================
    cy.get('ion-input[formControlName="fecha"] input')
      .type(fecha, { force: true });

    cy.get('ion-input[formControlName="minutos"] input')
      .clear({ force: true })
      .type(minutos, { force: true });

    // =============================
    // 7) SETEAR idTipoEjercicio DIRECTO EN EL ION-SELECT
    // =============================
    cy.get('@tipoId').then((tipoId: number) => {

      cy.get('ion-select[formControlName="idTipoEjercicio"]')
        .then(($sel) => {
          const el = $sel[0] as any;

          // seteamos el valor
          el.value = tipoId;

          // disparamos ionChange para que Angular reactive forms se entere
          const ev = new CustomEvent('ionChange', {
            detail: { value: tipoId },
            bubbles: true,
          });
          el.dispatchEvent(ev);
        });
    });

    // (Opcional) Podemos comprobar que ya no está inválido
    // cy.contains('El tipo es obligatorio.').should('not.exist');

    // =============================
    // 8) GUARDAR
    // =============================
    cy.contains('Guardar').click({ force: true });

    // Texto del botón cuando guardando = true


    // =============================
    // 9) VALIDAR RETORNO AL PANEL
    // =============================
    cy.location('pathname').should('include', '/panel/actividad');
    cy.location().should((loc) => {
      expect(loc.search).to.contain('hijoId=');
    });

  });

});
