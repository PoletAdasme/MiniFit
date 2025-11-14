import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectorHijoPage } from './selector-hijo.page';

describe('SelectorHijoPage', () => {
  let component: SelectorHijoPage;
  let fixture: ComponentFixture<SelectorHijoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectorHijoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
