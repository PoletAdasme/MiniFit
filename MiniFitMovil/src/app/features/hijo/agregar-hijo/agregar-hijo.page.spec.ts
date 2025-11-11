import { ComponentFixture, TestBed } from '@angular/core/testing';
import { agregarHijoPage } from './agregar-hijo.page';

describe('agregarHijoPage', () => {
  let component: agregarHijoPage;
  let fixture: ComponentFixture<agregarHijoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(agregarHijoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
