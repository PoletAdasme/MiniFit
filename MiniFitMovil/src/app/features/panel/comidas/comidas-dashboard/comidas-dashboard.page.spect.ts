import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ComidasDashboardPage } from './comidas-dashboard.page';

describe('ActividadDashboardPage', () => {
  let component: ComidasDashboardPage;
  let fixture: ComponentFixture<ComidasDashboardPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ComidasDashboardPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ComidasDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
