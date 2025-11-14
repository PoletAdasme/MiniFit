import { ComponentFixture, TestBed } from '@angular/core/testing';
import { editarHijoPage } from './editar-hijo.page';

describe('editarHijoPage', () => {
  let component: editarHijoPage;
  let fixture: ComponentFixture<editarHijoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(editarHijoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
