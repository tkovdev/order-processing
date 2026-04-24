import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { Dashboard } from './dashboard';

const DEFAULT_SUMMARY = {
  totalInventoryQuantity: 0,
  totalInventoryValue: 0,
  totalSales: 0,
  submittedSales: 0,
  completedSales: 0,
};

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushRequests(summaryOverride = DEFAULT_SUMMARY): void {
    httpMock.expectOne((req) => req.url.includes('/items')).flush({ items: [] });
    httpMock.expectOne((req) => req.url.includes('/sales')).flush({ sales: [] });
    httpMock
      .expectOne((req) => req.url.includes('/metrics/operations/summary'))
      .flush(summaryOverride);
  }

  it('should create', async () => {
    flushRequests();
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  it('should use backend-provided summary values from /metrics/operations/summary', async () => {
    flushRequests({
      totalInventoryQuantity: 120,
      totalInventoryValue: 4500,
      totalSales: 15,
      submittedSales: 5,
      completedSales: 10,
    });
    await fixture.whenStable();

    const model = component.model();
    expect(model.totalInventoryQuantity).toBe(120);
    expect(model.totalInventoryValue).toBe(4500);
    expect(model.totalSales).toBe(15);
    expect(model.submittedSales).toBe(5);
    expect(model.completedSales).toBe(10);
  });

  it('should show an error message and zero summary when the API fails', async () => {
    httpMock.expectOne((req) => req.url.includes('/items')).flush('', { status: 500, statusText: 'Server Error' });
    // forkJoin cancels remaining requests when one fails; clean up any that remain open
    httpMock.match(() => true);
    await fixture.whenStable();

    expect(component.errorMessage()).toBe('Unable to load dashboard data from the API.');
    expect(component.model().totalSales).toBe(0);
  });
});
