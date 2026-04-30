import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subject } from 'rxjs';
import { catchError, finalize, of, takeUntil, tap } from 'rxjs';
import { BreadcrumbService } from '../../shared/navigation/breadcrumb.service';
import { RecentSale, SalesApiService } from './sales-api.service';

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

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([{ label: 'Sales', url: '/sales' }]);
    this.fetchRecentSales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
