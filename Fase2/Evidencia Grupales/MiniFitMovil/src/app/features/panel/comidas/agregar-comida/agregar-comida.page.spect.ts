import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AgregarComidaPage } from './agregar-comida.page';

describe('AgregarComidaPage', () => {
  let component: AgregarComidaPage;
  let fixture: ComponentFixture<AgregarComidaPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AgregarComidaPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarComidaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
