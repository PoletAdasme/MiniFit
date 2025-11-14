import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditarComidaPage } from './editar-comida.page';

describe('EditarComidaPage', () => {
  let component: EditarComidaPage;
  let fixture: ComponentFixture<EditarComidaPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [EditarComidaPage],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarComidaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
