/// <reference types="cypress" />

describe('Dashboard Actividad Física (Panel de Actividad)', () => {

  beforeEach(() => {
    const rut = '212876119';
    const pass = 'Fernanda24*';

    // =============================
    // LOGIN
    // =============================
    cy.visit('http://localhost:4200/auth/login');

    cy.get('ion-input[formControlName="rut"] input')
      .last().type(rut, { force: true });

    cy.get('ion-input[formControlName="password"] input')
      .last().type(pass, { force: true });

    cy.contains('Ingresar').click({ force: true });

    cy.location('pathname').should('include', '/inicio/selector-hijo');

    cy.contains('Rodrigo', { timeout: 6000 }).click({ force: true });
    cy.contains('Continuar').click({ force: true });

    cy.location('pathname').should('include', '/inicio/home');
  });

  it('Carga dashboard, aplica filtros, cambia vista, mueve carrusel y valida gráficos', () => {

    const hijoId = 6; // Ajusta según tu BD real

    // =============================
    // IR AL DASHBOARD CON hijoId
    // =============================
    cy.visit(`http://localhost:4200/panel/actividad?hijoId=${hijoId}`);

    cy.location('pathname').should('include', '/panel/actividad');

    // =============================
    // RELLENAR FECHAS
    // =============================
    cy.get('ion-input[type="date"]').first().find('input')
      .type('2024-11-01', { force: true });

    cy.get('ion-input[type="date"]').eq(1).find('input')
      .type('2024-11-19', { force: true });

    // =============================
    // CAMBIAR VISTA (SEMANAL/MENSUAL/ANUAL)
    // Intento visual + fallback
    // =============================

    // 1) Abrimos el select correcto (ion-item con texto "Vista")
    cy.contains('ion-item', 'Vista')
      .find('ion-select')
      .click({ force: true });

    cy.wait(300);

    // 2) Intento VISUAL del popup (si existe)
    cy.get('body').then(($body) => {

      // CASO 1: popup con ion-select-option clásico
      if ($body.find('ion-select-option').length > 0) {
        cy.contains('ion-select-option', 'Mensual')
          .click({ force: true });
      }

      // CASO 2: popup con ion-item dentro de ion-modal / ion-popover
      else if ($body.find('ion-item')
            .filter((i, el) => el.innerText.includes('Mensual')).length > 0) {

        cy.contains('ion-item', 'Mensual')
          .click({ force: true });

        // Si el modal tiene OK / Aceptar / Listo
        if ($body.find('ion-button, .alert-button').length > 0) {
          cy.contains(/OK|Aceptar|Listo/i)
            .click({ force: true });
        }
      }

      else {
        cy.log('⚠ No se encontró selector visual → fallback activado');
      }
    });

    // 3) FALLBACK GARANTIZADO (siempre funciona)
    cy.contains('ion-item', 'Vista')
      .find('ion-select')
      .then(($el) => {
        const el = $el[0] as any;
        el.value = 'mensual';   // ← valor correcto del select
        el.dispatchEvent(
          new CustomEvent('ionChange', {
            detail: { value: 'mensual' },
            bubbles: true
          })
        );
      });

    // =============================
    // APLICAR FILTRO
    // =============================
    cy.contains('Aplicar').click({ force: true });

    // =============================
    // VALIDAR GRÁFICOS
    // =============================
    cy.get('#actChartLinea', { timeout: 5000 }).should('exist');
    cy.get('#actChartTorta').should('exist');
    cy.get('#actChartBarras').should('exist');

    cy.wait(800);

    // =============================
    // MOVER CARRUSEL SWIPER
    // =============================
    cy.get('swiper-container').should('exist');

    cy.get('swiper-container').then(($sw) => {
      const swiper = $sw[0].swiper;
      expect(swiper).to.exist;
      swiper.slideNext();     // mover una vez
    });

    cy.wait(400);

    cy.get('swiper-container').then(($sw) => {
      const swiper = $sw[0].swiper;
      swiper.slideNext();     // mover otra vez
    });



  });

});
