import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sales } from './sales';

describe('Sales', () => {
  let component: Sales;
  let fixture: ComponentFixture<Sales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sales],
    }).compileComponents();

    fixture = TestBed.createComponent(Sales);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the page heading', () => {
    const h1: HTMLElement = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Sales');
  });

  it('should render three layout zones', () => {
    const zones: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.sales-zone');
    expect(zones.length).toBe(3);
  });

  it('should render four stat cards in the overview zone', () => {
    const cards: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.stat-card');
    expect(cards.length).toBe(4);
  });

  it('should render the filters zone with search, status, and date inputs', () => {
    const search: HTMLInputElement | null = fixture.nativeElement.querySelector('input[aria-label="Search sales"]');
    const status: HTMLSelectElement | null = fixture.nativeElement.querySelector('select[aria-label="Filter by status"]');
    const date: HTMLInputElement | null = fixture.nativeElement.querySelector('input[aria-label="Filter by date"]');
    expect(search).not.toBeNull();
    expect(status).not.toBeNull();
    expect(date).not.toBeNull();
  });

  it('should render the transactions table', () => {
    const table: HTMLTableElement | null = fixture.nativeElement.querySelector('.sales-table');
    expect(table).not.toBeNull();
  });

  it('should show empty state when no transactions are present', () => {
    const emptyState: HTMLElement | null = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).not.toBeNull();
    expect(emptyState!.textContent).toContain('No transactions to display yet.');
  });

  it('should not show loading spinner after init', () => {
    expect(component.loading()).toBe(false);
    const spinner: HTMLElement | null = fixture.nativeElement.querySelector('.status-block.loading');
    expect(spinner).toBeNull();
  });

  it('should show loading spinner while loading is true', () => {
    component.loading.set(true);
    fixture.detectChanges();
    const spinner: HTMLElement | null = fixture.nativeElement.querySelector('.status-block.loading');
    expect(spinner).not.toBeNull();
  });

  it('should update searchFilter signal when search input changes', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[aria-label="Search sales"]');
    input.value = 'ORD-001';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.searchFilter()).toBe('ORD-001');
  });

  it('should update statusFilter signal when status dropdown changes', () => {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[aria-label="Filter by status"]');
    select.value = 'completed';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.statusFilter()).toBe('completed');
  });
});
