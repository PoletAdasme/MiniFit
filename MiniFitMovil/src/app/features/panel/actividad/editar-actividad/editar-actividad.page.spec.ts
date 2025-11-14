import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditarActividadPage } from './editar-actividad.page';

describe('EditarActividadPage', () => {
  let component: EditarActividadPage;
  let fixture: ComponentFixture<EditarActividadPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditarActividadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
