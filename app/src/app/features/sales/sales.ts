import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subject } from 'rxjs';
import { catchError, finalize, of, takeUntil, tap } from 'rxjs';
import { BreadcrumbService } from '../../shared/navigation/breadcrumb.service';
import { RecentSale, SaleDetail, SalesApiService } from './sales-api.service';

@Component({
  selector: 'app-sales',
  imports: [CommonModule, ProgressSpinnerModule],
  templateUrl: './sales.html',
  styleUrl: './sales.css',
})
export class Sales implements OnInit, OnDestroy {
  private readonly salesApi = inject(SalesApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly destroy$ = new Subject<void>();

  loading = signal(true);
  errorMessage = signal('');
  recentSales = signal<RecentSale[]>([]);
  rowLimit = signal(25);

  dateFilter = signal('');
  statusFilter = signal('');
  searchFilter = signal('');

  drawerOpen = signal(false);
  drawerLoading = signal(false);
  selectedSale = signal<SaleDetail | null>(null);
  processingLoading = signal(false);
  processSuccess = signal('');
  processError = signal('');

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([{ label: 'Sales', url: '/sales' }]);
    this.fetchRecentSales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openDrawer(sale: RecentSale): void {
    this.drawerOpen.set(true);
    this.drawerLoading.set(true);
    this.selectedSale.set(null);
    this.processSuccess.set('');
    this.processError.set('');

    this.salesApi
      .getSaleDetail(sale.saleId)
      .pipe(
        tap((detail) => this.selectedSale.set(detail)),
        catchError(() => {
          this.processError.set('Unable to load sale details.');
          return of(null);
        }),
        finalize(() => this.drawerLoading.set(false)),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.selectedSale.set(null);
    this.processSuccess.set('');
    this.processError.set('');
  }

  onProcessSale(saleId: string): void {
    this.processingLoading.set(true);
    this.processSuccess.set('');
    this.processError.set('');

    this.salesApi
      .processSale(saleId)
      .pipe(
        tap(() => {
          this.processSuccess.set('Sale processed successfully.');
          this.recentSales.update((sales) =>
            sales.map((s) => (s.saleId === saleId ? { ...s, status: 'completed' } : s)),
          );
          const current = this.selectedSale();
          if (current) {
            this.selectedSale.set({ ...current, status: 'completed' });
          }
        }),
        catchError(() => {
          this.processError.set('Failed to process sale. Please try again.');
          return of(null);
        }),
        finalize(() => this.processingLoading.set(false)),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  private fetchRecentSales(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.salesApi
      .getRecentSales(this.rowLimit())
      .pipe(
        tap((sales) => this.recentSales.set(sales)),
        catchError(() => {
          this.errorMessage.set('Unable to load recent sales from the API.');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }
}
