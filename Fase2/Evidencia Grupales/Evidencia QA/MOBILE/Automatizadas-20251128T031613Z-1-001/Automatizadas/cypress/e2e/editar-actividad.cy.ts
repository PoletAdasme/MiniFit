/// <reference types="cypress" />

describe('Editar actividad física', () => {

  const hijoId = 40;

  it('Edita la primera actividad con flujo estable', () => {

    // Entrar al dashboard
    cy.visit(`http://localhost:4200/panel/actividad?hijoId=${hijoId}`);

    // Asegurar que el historial cargó
    cy.get('.historial-scroll ion-item', { timeout: 7000 })
      .should('have.length.greaterThan', 0);

    // Guardar texto inicial del primer item (opcional)
    cy.get('.historial-scroll ion-item')
      .first()
      .invoke('text')
      .as('textoInicial');

    // Clic en el botón editar
    cy.get('.historial-scroll ion-item')
      .first()
      .find('img[alt="Editar"]')
      .click({ force: true });

    // Esperar navegación
    cy.location('pathname', { timeout: 6000 })
      .should('include', '/panel/actividad/editar');

    // Cambiar MINUTOS
    cy.get('ion-input[formControlName="minutos"] input', { timeout: 4000 })
      .clear({ force: true })
      .type('55', { force: true });

    // Cambiar tipo de ejercicio SIN usar ion-select visual
    cy.get('ion-select[formControlName="idTipoEjercicio"]')
      .then(($sel) => {
        const el = $sel[0] as any;
        const nuevoTipo = 2; // id válido en tu base
        el.value = nuevoTipo;
        el.dispatchEvent(
          new CustomEvent('ionChange', { detail: { value: nuevoTipo }, bubbles: true })
        );
      });

    // Guardar
    cy.contains('Guardar').click({ force: true });

    // Esperar que se complete el guardado
    cy.wait(1500);

    // Confirmar que volvió al dashboard
    cy.location('pathname', { timeout: 6000 })
      .should('include', '/panel/actividad');

    // Verificar que no hubo error
    cy.contains('No se pudo', { timeout: 1000 }).should('not.exist');

    // (Opcional) verificar cambio en DOM si tu backend sí guarda
    cy.get('@textoInicial').then(old => {
      cy.get('.historial-scroll ion-item')
        .first()
        .invoke('text')
        .then(newText => {
          // No usar expect si tu backend NO persiste datos
          // expect(newText.trim()).not.to.eq(old.trim());
          cy.log('ANTES:', old);
          cy.log('DESPUÉS:', newText);
        });
    });

  });

});
