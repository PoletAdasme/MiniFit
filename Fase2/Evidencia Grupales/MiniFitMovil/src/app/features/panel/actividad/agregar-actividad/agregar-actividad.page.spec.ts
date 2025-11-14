import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AgregarActividadPage } from './agregar-actividad.page';

describe('AgregarActividadPage', () => {
  let component: AgregarActividadPage;
  let fixture: ComponentFixture<AgregarActividadPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AgregarActividadPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarActividadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
