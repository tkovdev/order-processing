import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { Dashboard } from './dashboard';
import { CustomerValueRanking, InventoryRiskExposure, LocationInventorySummary, RecentSale, TopValueItem } from './dashboard-api.service';

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
    recentSalesOverride: RecentSale[] = [],
    customerValueRankingOverride: CustomerValueRanking[] = [],
    inventoryRiskExposureOverride: InventoryRiskExposure[] = [],
  ): void {
    httpMock
      .expectOne((req) => req.url.includes('/metrics/operations/summary'))
      .flush(summaryOverride);
    httpMock
      .expectOne((req) => req.url.includes('/inventory/locations/summary'))
      .flush(locationSummaryOverride);
    httpMock
      .expectOne((req) => req.url.includes('/inventory/items/top-value'))
      .flush(topValueItemsOverride);
    httpMock
      .expectOne((req) => req.url.includes('/sales/recent'))
      .flush(recentSalesOverride);
    httpMock
      .expectOne((req) => req.url.includes('/customers/value-ranking'))
      .flush(customerValueRankingOverride);
    httpMock
      .expectOne((req) => req.url.includes('/inventory/risk/exposure'))
      .flush(inventoryRiskExposureOverride);
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

  it('should use backend-provided recentSales from /sales/recent', async () => {
    const recentSales: RecentSale[] = [
      {
        saleId: 'sale-1',
        createdAt: '2026-04-23T19:15:00.000Z',
        status: 'submitted',
        customerName: 'Alice Smith',
        customerEmail: 'alice@example.com',
        lineCount: 3,
        totalUnits: 10,
        totalValue: 250,
      },
      {
        saleId: 'sale-2',
        createdAt: '2026-04-22T10:00:00.000Z',
        status: 'completed',
        customerName: 'Bob Jones',
        customerEmail: 'bob@example.com',
        lineCount: 1,
        totalUnits: 2,
        totalValue: 80,
      },
    ];
    flushRequests(DEFAULT_SUMMARY, [], [], recentSales);
    await fixture.whenStable();

    const model = component.model();
    expect(model.recentSales.length).toBe(2);
    expect(model.recentSales[0].saleId).toBe('sale-1');
    expect(model.recentSales[0].customerName).toBe('Alice Smith');
    expect(model.recentSales[0].customerEmail).toBe('alice@example.com');
    expect(model.recentSales[0].status).toBe('submitted');
    expect(model.recentSales[0].lineCount).toBe(3);
    expect(model.recentSales[0].totalUnits).toBe(10);
    expect(model.recentSales[0].totalValue).toBe(250);
    expect(model.recentSales[1].saleId).toBe('sale-2');
    expect(model.recentSales[1].status).toBe('completed');
  });

  it('should show an empty recentSales list when backend returns an empty array', async () => {
    flushRequests(DEFAULT_SUMMARY, [], [], []);
    await fixture.whenStable();

    expect(component.model().recentSales.length).toBe(0);
  });

  it('should use backend-provided customerSummary from /customers/value-ranking', async () => {
    const customerValueRanking: CustomerValueRanking[] = [
      {
        customerName: 'Alice Smith',
        customerEmail: 'alice@example.com',
        salesCount: 5,
        totalUnits: 20,
        totalValue: 1500,
      },
      {
        customerName: 'Bob Jones',
        customerEmail: 'bob@example.com',
        salesCount: 2,
        totalUnits: 8,
        totalValue: 400,
      },
    ];
    flushRequests(DEFAULT_SUMMARY, [], [], [], customerValueRanking);
    await fixture.whenStable();

    const model = component.model();
    expect(model.customerSummary.length).toBe(2);
    expect(model.customerSummary[0].customerName).toBe('Alice Smith');
    expect(model.customerSummary[0].customerEmail).toBe('alice@example.com');
    expect(model.customerSummary[0].salesCount).toBe(5);
    expect(model.customerSummary[0].totalUnits).toBe(20);
    expect(model.customerSummary[0].totalValue).toBe(1500);
    expect(model.customerSummary[1].customerName).toBe('Bob Jones');
    expect(model.customerSummary[1].totalValue).toBe(400);
  });

  it('should show an empty customerSummary list when backend returns an empty array', async () => {
    flushRequests(DEFAULT_SUMMARY, [], [], [], []);
    await fixture.whenStable();

    expect(component.model().customerSummary.length).toBe(0);
  });

  it('should use backend-provided atRiskItems from /inventory/risk/exposure', async () => {
    const inventoryRiskExposure: InventoryRiskExposure[] = [
      {
        itemId: 'item-1',
        name: 'Critical Widget',
        location: 'Warehouse A',
        quantity: 5,
        unitPrice: 200,
        atRiskValue: 1000,
        targetQuantity: 25,
        riskScore: 80,
        riskLevel: 'high',
      },
      {
        itemId: 'item-2',
        name: 'Medium Widget',
        location: 'Warehouse B',
        quantity: 12,
        unitPrice: 150,
        atRiskValue: 1800,
        targetQuantity: 20,
        riskScore: 55,
        riskLevel: 'medium',
      },
    ];
    flushRequests(DEFAULT_SUMMARY, [], [], [], [], inventoryRiskExposure);
    await fixture.whenStable();

    const model = component.model();
    expect(model.atRiskItems.length).toBe(2);
    expect(model.atRiskItems[0].itemId).toBe('item-1');
    expect(model.atRiskItems[0].name).toBe('Critical Widget');
    expect(model.atRiskItems[0].location).toBe('Warehouse A');
    expect(model.atRiskItems[0].quantity).toBe(5);
    expect(model.atRiskItems[0].unitPrice).toBe(200);
    expect(model.atRiskItems[0].atRiskValue).toBe(1000);
    expect(model.atRiskItems[0].targetQuantity).toBe(25);
    expect(model.atRiskItems[0].riskScore).toBe(80);
    expect(model.atRiskItems[0].riskLevel).toBe('high');
    expect(model.atRiskItems[1].riskLevel).toBe('medium');
  });

  it('should show an empty atRiskItems list when backend returns an empty array', async () => {
    flushRequests(DEFAULT_SUMMARY, [], [], [], [], []);
    await fixture.whenStable();

    expect(component.model().atRiskItems.length).toBe(0);
  });

  it('should show an error message and zero summary when the API fails', async () => {
    httpMock.expectOne((req) => req.url.includes('/metrics/operations/summary')).flush('', { status: 500, statusText: 'Server Error' });
    // forkJoin cancels remaining requests when one fails; clean up any that remain open
    httpMock.match(() => true);
    await fixture.whenStable();

    expect(component.errorMessage()).toBe('Unable to load dashboard data from the API.');
    expect(component.model().totalSales).toBe(0);
  });
});
