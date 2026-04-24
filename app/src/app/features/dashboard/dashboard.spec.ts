import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { Dashboard } from './dashboard';
import { LocationInventorySummary, TopValueItem } from './dashboard-api.service';

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

  function flushRequests(
    summaryOverride = DEFAULT_SUMMARY,
    locationSummaryOverride: LocationInventorySummary[] = [],
    topValueItemsOverride: TopValueItem[] = [],
  ): void {
    httpMock.expectOne((req) => req.url.includes('/items') && !req.url.includes('top-value')).flush({ items: [] });
    httpMock.expectOne((req) => req.url.includes('/sales')).flush({ sales: [] });
    httpMock
      .expectOne((req) => req.url.includes('/metrics/operations/summary'))
      .flush(summaryOverride);
    httpMock
      .expectOne((req) => req.url.includes('/inventory/locations/summary'))
      .flush(locationSummaryOverride);
    httpMock
      .expectOne((req) => req.url.includes('/inventory/items/top-value'))
      .flush(topValueItemsOverride);
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

  it('should use backend-provided inventoryByLocation from /inventory/locations/summary', async () => {
    const locationSummary = [
      { location: 'Warehouse A', itemCount: 3, quantity: 50, value: 1500 },
      { location: 'Warehouse B', itemCount: 1, quantity: 10, value: 200 },
    ];
    flushRequests(DEFAULT_SUMMARY, locationSummary);
    await fixture.whenStable();

    const model = component.model();
    expect(model.inventoryByLocation.length).toBe(2);
    expect(model.inventoryByLocation[0].location).toBe('Warehouse A');
    expect(model.inventoryByLocation[0].itemCount).toBe(3);
    expect(model.inventoryByLocation[0].quantity).toBe(50);
    expect(model.inventoryByLocation[0].value).toBe(1500);
  });

  it('should sort inventoryByLocation by value descending', async () => {
    const locationSummary = [
      { location: 'Warehouse B', itemCount: 1, quantity: 10, value: 200 },
      { location: 'Warehouse A', itemCount: 3, quantity: 50, value: 1500 },
    ];
    flushRequests(DEFAULT_SUMMARY, locationSummary);
    await fixture.whenStable();

    const locations = component.model().inventoryByLocation;
    expect(locations[0].location).toBe('Warehouse A');
    expect(locations[1].location).toBe('Warehouse B');
  });

  it('should use backend-provided topValueItems from /inventory/items/top-value', async () => {
    const topValueItems: TopValueItem[] = [
      { itemId: 'id1', name: 'Widget Alpha', location: 'Warehouse A', quantity: 100, unitPrice: 50, value: 5000 },
      { itemId: 'id2', name: 'Widget Beta', location: 'Warehouse B', quantity: 20, unitPrice: 150, value: 3000 },
    ];
    flushRequests(DEFAULT_SUMMARY, [], topValueItems);
    await fixture.whenStable();

    const model = component.model();
    expect(model.topValueItems.length).toBe(2);
    expect(model.topValueItems[0].itemId).toBe('id1');
    expect(model.topValueItems[0].name).toBe('Widget Alpha');
    expect(model.topValueItems[0].location).toBe('Warehouse A');
    expect(model.topValueItems[0].quantity).toBe(100);
    expect(model.topValueItems[0].unitPrice).toBe(50);
    expect(model.topValueItems[0].value).toBe(5000);
  });

  it('should show an empty topValueItems list when backend returns an empty array', async () => {
    flushRequests(DEFAULT_SUMMARY, [], []);
    await fixture.whenStable();

    expect(component.model().topValueItems.length).toBe(0);
  });

  it('should show an error message and zero summary when the API fails', async () => {
    httpMock.expectOne((req) => req.url.includes('/items') && !req.url.includes('top-value')).flush('', { status: 500, statusText: 'Server Error' });
    // forkJoin cancels remaining requests when one fails; clean up any that remain open
    httpMock.match(() => true);
    await fixture.whenStable();

    expect(component.errorMessage()).toBe('Unable to load dashboard data from the API.');
    expect(component.model().totalSales).toBe(0);
  });
});
