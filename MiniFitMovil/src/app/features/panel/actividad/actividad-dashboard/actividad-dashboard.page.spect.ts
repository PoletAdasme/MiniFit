import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ActividadDashboardPage } from './actividad-dashboard.page';

describe('ActividadDashboardPage', () => {
  let component: ActividadDashboardPage;
  let fixture: ComponentFixture<ActividadDashboardPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ActividadDashboardPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ActividadDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
