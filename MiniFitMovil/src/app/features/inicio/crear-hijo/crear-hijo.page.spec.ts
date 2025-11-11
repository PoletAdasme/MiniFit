import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearHijoPage } from './crear-hijo.page';

describe('CrearHijoPage', () => {
  let component: CrearHijoPage;
  let fixture: ComponentFixture<CrearHijoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CrearHijoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
