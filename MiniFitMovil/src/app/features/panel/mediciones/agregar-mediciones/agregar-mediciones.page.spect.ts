import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AgregarMedicionesPage } from './agregar-mediciones.page';

describe('AgregarMedicionesPage', () => {
  let component: AgregarMedicionesPage;
  let fixture: ComponentFixture<AgregarMedicionesPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AgregarMedicionesPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarMedicionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
