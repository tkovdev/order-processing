import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Sales } from './sales';
import { RecentSale, SaleDetail, SalesApiService } from './sales-api.service';

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

function makeSaleDetail(overrides: Partial<SaleDetail> = {}): SaleDetail {
  return {
    _id: 'sale-1',
    status: 'submitted',
    createdAt: '2026-04-01T10:00:00.000Z',
    customer: {
      name: 'Alice Smith',
      email: 'alice@example.com',
      address: '123 Main St, Springfield',
    },
    items: [
      { _id: 'item-a', itemId: 'ITM-001', quantity: 3, price: 30 },
      { _id: 'item-b', itemId: 'ITM-002', quantity: 2, price: 15 },
    ],
    ...overrides,
  };
}

describe('Sales', () => {
  let component: Sales;
  let fixture: ComponentFixture<Sales>;
  let salesApiSpy: {
    getRecentSales: ReturnType<typeof vi.fn>;
    getSaleDetail: ReturnType<typeof vi.fn>;
    processSale: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.useFakeTimers();

    salesApiSpy = {
      getRecentSales: vi.fn().mockReturnValue(of([])),
      getSaleDetail: vi.fn().mockReturnValue(of(makeSaleDetail())),
      processSale: vi.fn().mockReturnValue(of({ message: 'Sale processed successfully', sale: makeSaleDetail({ status: 'completed' }) })),
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

  // --- Drawer tests ---

  it('should open drawer when a table row is clicked', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale()]));
    initAndFlush();
    expect(component.drawerOpen()).toBe(false);
    const row: HTMLElement = fixture.nativeElement.querySelector('.sales-table-row');
    row.click();
    fixture.detectChanges();
    expect(component.drawerOpen()).toBe(true);
  });

  it('should call getSaleDetail with the sale id when a row is clicked', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale()]));
    initAndFlush();
    const row: HTMLElement = fixture.nativeElement.querySelector('.sales-table-row');
    row.click();
    expect(salesApiSpy.getSaleDetail).toHaveBeenCalledWith('sale-1');
  });

  it('should render the drawer with customer info after row click', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale()]));
    initAndFlush();
    const row: HTMLElement = fixture.nativeElement.querySelector('.sales-table-row');
    row.click();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    const drawer: HTMLElement | null = fixture.nativeElement.querySelector('.drawer');
    expect(drawer).not.toBeNull();
    expect(drawer!.textContent).toContain('Alice Smith');
    expect(drawer!.textContent).toContain('alice@example.com');
    expect(drawer!.textContent).toContain('123 Main St, Springfield');
  });

  it('should render line items in the drawer', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale()]));
    initAndFlush();
    const row: HTMLElement = fixture.nativeElement.querySelector('.sales-table-row');
    row.click();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    const rows: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.drawer-items-table tbody tr');
    expect(rows.length).toBe(2);
  });

  it('should show Process Sale button for submitted sales', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale({ status: 'submitted' })]));
    initAndFlush();
    const row: HTMLElement = fixture.nativeElement.querySelector('.sales-table-row');
    row.click();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('.btn-process');
    expect(btn).not.toBeNull();
  });

  it('should NOT show Process Sale button for completed sales', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale({ status: 'completed' })]));
    salesApiSpy.getSaleDetail.mockReturnValue(of(makeSaleDetail({ status: 'completed' })));
    initAndFlush();
    const row: HTMLElement = fixture.nativeElement.querySelector('.sales-table-row');
    row.click();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('.btn-process');
    expect(btn).toBeNull();
  });

  it('should close the drawer when the close button is clicked', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale()]));
    initAndFlush();
    const row: HTMLElement = fixture.nativeElement.querySelector('.sales-table-row');
    row.click();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.drawer-close-btn');
    closeBtn.click();
    fixture.detectChanges();
    expect(component.drawerOpen()).toBe(false);
    const drawer: HTMLElement | null = fixture.nativeElement.querySelector('.drawer');
    expect(drawer).toBeNull();
  });

  it('should close the drawer when the overlay is clicked', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale()]));
    initAndFlush();
    component.openDrawer(makeSale());
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    const overlay: HTMLElement | null = fixture.nativeElement.querySelector('.drawer-overlay');
    overlay!.click();
    fixture.detectChanges();
    expect(component.drawerOpen()).toBe(false);
  });

  it('should call processSale API when Process Sale button is clicked', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale()]));
    initAndFlush();
    const row: HTMLElement = fixture.nativeElement.querySelector('.sales-table-row');
    row.click();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-process');
    btn.click();
    expect(salesApiSpy.processSale).toHaveBeenCalledWith('sale-1');
  });

  it('should show success feedback and update sale status after processing', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale()]));
    initAndFlush();
    const row: HTMLElement = fixture.nativeElement.querySelector('.sales-table-row');
    row.click();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-process');
    btn.click();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    expect(component.processSuccess()).toBe('Sale processed successfully.');
    const successEl: HTMLElement | null = fixture.nativeElement.querySelector('.drawer-feedback--success');
    expect(successEl).not.toBeNull();
  });

  it('should update sale status in the table after successful processing', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale()]));
    initAndFlush();
    const row: HTMLElement = fixture.nativeElement.querySelector('.sales-table-row');
    row.click();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-process');
    btn.click();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    expect(component.recentSales()[0].status).toBe('completed');
  });

  it('should show error feedback when processSale API fails', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale()]));
    salesApiSpy.processSale.mockReturnValue(throwError(() => new Error('Server error')));
    initAndFlush();
    const row: HTMLElement = fixture.nativeElement.querySelector('.sales-table-row');
    row.click();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-process');
    btn.click();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    expect(component.processError()).toBe('Failed to process sale. Please try again.');
    const errorEl: HTMLElement | null = fixture.nativeElement.querySelector('.drawer-feedback--error');
    expect(errorEl).not.toBeNull();
  });

  it('should show error feedback when getSaleDetail fails', () => {
    salesApiSpy.getRecentSales.mockReturnValue(of([makeSale()]));
    salesApiSpy.getSaleDetail.mockReturnValue(throwError(() => new Error('Not found')));
    initAndFlush();
    component.openDrawer(makeSale());
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    expect(component.processError()).toBe('Unable to load sale details.');
  });
});
