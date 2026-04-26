import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { LocationDetails } from './location-details';
import { LocationInventorySummaryResponse } from './location-details-api.service';

const ACTIVATED_ROUTE_STUB = {
  snapshot: { paramMap: { get: () => 'warehouse-a' } },
};

describe('LocationDetails', () => {
  let component: LocationDetails;
  let fixture: ComponentFixture<LocationDetails>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationDetails],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: ACTIVATED_ROUTE_STUB },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationDetails);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushRequests(
    summaryResponse: LocationInventorySummaryResponse[] = [],
    itemsResponse: { items: unknown[] } = { items: [] },
  ): void {
    httpMock
      .expectOne((req) => req.url.includes('/inventory/locations/') && req.url.includes('/summary'))
      .flush(summaryResponse);
    httpMock.expectOne((req) => req.url.includes('/items')).flush(itemsResponse);
  }

  it('should create', async () => {
    flushRequests();
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  it('should use backend-provided itemCount, totalUnits and totalValue from summary endpoint', async () => {
    const summaryResponse: LocationInventorySummaryResponse[] = [
      {
        location: 'Warehouse A',
        inventorySummary: { itemCount: 7, totalUnits: 120, totalValue: 9500 },
      },
    ];
    flushRequests(summaryResponse, { items: [] });
    await fixture.whenStable();

    expect(component.stats().itemTypes).toBe(7);
    expect(component.stats().totalUnits).toBe(120);
    expect(component.stats().totalValue).toBe(9500);
  });

  it('should fall back to zero values when summary returns empty', async () => {
    flushRequests([], { items: [] });
    await fixture.whenStable();

    expect(component.stats().itemTypes).toBe(0);
    expect(component.stats().totalUnits).toBe(0);
    expect(component.stats().totalValue).toBe(0);
  });

  it('should show an error message when the API fails', async () => {
    httpMock
      .expectOne((req) => req.url.includes('/inventory/locations/') && req.url.includes('/summary'))
      .flush('', { status: 500, statusText: 'Server Error' });
    httpMock.match(() => true);
    await fixture.whenStable();

    expect(component.errorMessage()).toBe('Unable to load this location inventory snapshot from the API.');
    expect(component.loading()).toBe(false);
  });
});
