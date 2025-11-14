import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MedicionesDashboardPage } from './mediciones-dashboard.page';

describe('MedicionesDashboardPage', () => {
  let component: MedicionesDashboardPage;
  let fixture: ComponentFixture<MedicionesDashboardPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MedicionesDashboardPage],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicionesDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
