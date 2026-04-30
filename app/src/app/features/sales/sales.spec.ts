import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Sales } from './sales';
import { RecentSale, SalesApiService } from './sales-api.service';

function makeSale(overrides: Partial<RecentSale> = {}): RecentSale {
  return {
    saleId: 'sale-1',
    createdAt: '2026-04-01T10:00:00.000Z',
    status: 'submitted',
    customerName: 'Alice Smith',
    customerEmail: 'alice@example.com',
    lineCount: 2,
    totalUnits: 5,
    totalValue: 150,
    ...overrides,
  };
}

describe('Sales', () => {
  let component: Sales;
  let fixture: ComponentFixture<Sales>;
  let salesApiSpy: { getRecentSales: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.useFakeTimers();

    salesApiSpy = {
      getRecentSales: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [Sales],
      providers: [{ provide: SalesApiService, useValue: salesApiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(Sales);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function initAndFlush(): void {
    fixture.detectChanges();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
  }

  it('should create', () => {
    initAndFlush();
    expect(component).toBeTruthy();
  });

  it('should render the page heading', () => {
    initAndFlush();
    const h1: HTMLElement = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Sales');
  });

  it('should render three layout zones', () => {
    initAndFlush();
    const zones: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.sales-zone');
    expect(zones.length).toBe(3);
  });

  it('should render four stat cards in the overview zone', () => {
    initAndFlush();
    const cards: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.stat-card');
    expect(cards.length).toBe(4);
  });

  it('should render the filters zone with search, status, and date inputs', () => {
    initAndFlush();
    const search: HTMLInputElement | null = fixture.nativeElement.querySelector('input[aria-label="Search sales"]');
    const status: HTMLSelectElement | null = fixture.nativeElement.querySelector('select[aria-label="Filter by status"]');
    const date: HTMLInputElement | null = fixture.nativeElement.querySelector('input[aria-label="Filter by date"]');
    expect(search).not.toBeNull();
    expect(status).not.toBeNull();
    expect(date).not.toBeNull();
  });

  it('should not be in loading state after successful fetch', () => {
    initAndFlush();
    expect(component.loading()).toBe(false);
  });

  it('should show loading spinner while loading is true', () => {
    initAndFlush();
    component.loading.set(true);
    fixture.detectChanges();
    const spinner: HTMLElement | null = fixture.nativeElement.querySelector('.status-block.loading');
    expect(spinner).not.toBeNull();
  });

  it('should not show loading spinner after fetch completes', () => {
    initAndFlush();
    const spinner: HTMLElement | null = fixture.nativeElement.querySelector('.status-block.loading');
    expect(spinner).toBeNull();
  });

  it('should show empty state when API returns no sales', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([]));
    initAndFlush();
    const emptyState: HTMLElement | null = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).not.toBeNull();
    expect(emptyState!.textContent).toContain('No recent sales to display.');
  });

  it('should render the recent sales table when data is present', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale()]));
    initAndFlush();
    const table: HTMLTableElement | null = fixture.nativeElement.querySelector('.sales-table');
    expect(table).not.toBeNull();
  });

  it('should render one row per sale', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale(), makeSale({ saleId: 'sale-2' })]));
    initAndFlush();
    const rows: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.sales-table tbody tr');
    expect(rows.length).toBe(2);
  });

  it('should display customer name and email in the row', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale()]));
    initAndFlush();
    const row: HTMLElement = fixture.nativeElement.querySelector('.sales-table tbody tr');
    expect(row.textContent).toContain('Alice Smith');
    expect(row.textContent).toContain('alice@example.com');
  });

  it('should apply status-badge--submitted class for submitted sales', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale({ status: 'submitted' })]));
    initAndFlush();
    const badge: HTMLElement = fixture.nativeElement.querySelector('.status-badge');
    expect(badge.classList).toContain('status-badge--submitted');
    expect(badge.classList).not.toContain('status-badge--completed');
  });

  it('should apply status-badge--completed class for completed sales', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale({ status: 'completed' })]));
    initAndFlush();
    const badge: HTMLElement = fixture.nativeElement.querySelector('.status-badge');
    expect(badge.classList).toContain('status-badge--completed');
    expect(badge.classList).not.toContain('status-badge--submitted');
  });

  it('should show a non-blocking error warning when the API fails', () => {
    salesApiSpy.getRecentSales.mockReturnValue(throwError(() => new Error('Network error')));
    initAndFlush();
    expect(component.errorMessage()).toBe('Unable to load recent sales from the API.');
    expect(component.loading()).toBe(false);
    const warning: HTMLElement | null = fixture.nativeElement.querySelector('.status-block.warning');
    expect(warning).not.toBeNull();
  });

  it('should not crash and show empty state when API returns empty array', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([]));
    initAndFlush();
    expect(component.recentSales()).toEqual([]);
    const emptyState: HTMLElement | null = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).not.toBeNull();
  });

  it('should call getRecentSales with the configured row limit', () => {
    component.rowLimit.set(10);
    initAndFlush();
    expect(salesApiSpy.getRecentSales).toHaveBeenCalledWith(10);
  });

  it('should update searchFilter signal when search input changes', () => {
    initAndFlush();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[aria-label="Search sales"]');
    input.value = 'ORD-001';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.searchFilter()).toBe('ORD-001');
  });

  it('should update statusFilter signal when status dropdown changes', () => {
    initAndFlush();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[aria-label="Filter by status"]');
    select.value = 'completed';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.statusFilter()).toBe('completed');
  });
});
