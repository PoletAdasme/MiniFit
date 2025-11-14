import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReportesPage } from './reportes.page';

describe('ReportesPage', () => {
  let component: ReportesPage;
  let fixture: ComponentFixture<ReportesPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ReportesPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
