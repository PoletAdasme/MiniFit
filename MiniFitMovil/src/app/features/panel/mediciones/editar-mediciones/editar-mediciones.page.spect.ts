import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditarMedicionesPage } from './editar-mediciones.page';

describe('EditarMedicionesPage', () => {
  let component: EditarMedicionesPage;
  let fixture: ComponentFixture<EditarMedicionesPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [EditarMedicionesPage],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarMedicionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
