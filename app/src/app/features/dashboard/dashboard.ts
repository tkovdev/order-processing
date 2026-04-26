import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subject, interval, merge, of } from 'rxjs';
import { finalize, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { DashboardApiService, DashboardDataUpdate } from './dashboard-api.service';
import { CustomerSummary, DashboardViewModel, RiskItem, TopItem } from './models';

const EMPTY_MODEL: DashboardViewModel = {
  totalInventoryQuantity: 0,
  totalInventoryValue: 0,
  totalSales: 0,
  submittedSales: 0,
  completedSales: 0,
  inventoryByLocation: [],
  topValueItems: [],
  recentSales: [],
  customerSummary: [],
  atRiskItems: [],
};

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ProgressSpinnerModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly destroy$ = new Subject<void>();
  private readonly manualRefresh$ = new Subject<void>();

  private readonly refreshMs = 30_000;

  loading = signal(true);
  errorMessage = signal('');
  lastUpdated = signal<Date | null>(null);

  model = signal<DashboardViewModel>(EMPTY_MODEL);

  ngOnInit(): void {
    merge(of(null), interval(this.refreshMs), this.manualRefresh$)
      .pipe(
        switchMap(() => this.fetchDashboardData()),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshNow(): void {
    this.manualRefresh$.next();
  }

  private fetchDashboardData() {
    this.loading.set(true);
    this.errorMessage.set('');

    return this.dashboardApi.fetchDashboardDataUpdates().pipe(
      tap((update) => this.applyUpdate(update)),
      finalize(() => this.loading.set(false)),
      map(() => null),
    );
  }

  private applyUpdate(update: DashboardDataUpdate): void {
    if (update.kind === 'error') {
      this.errorMessage.set('Unable to load dashboard data from the API.');
      return;
    }

    this.model.update((current) => ({
      ...current,
      ...this.toModelPatch(update),
    }));
    this.lastUpdated.set(new Date());
  }

  private toModelPatch(update: DashboardDataUpdate): Partial<DashboardViewModel> {
    switch (update.kind) {
      case 'operationsSummary':
        return update.data;
      case 'locationSummary':
        return {
          inventoryByLocation: [...update.data].sort((a, b) => b.value - a.value),
        };
      case 'topValueItems':
        return {
          topValueItems: update.data.map((item): TopItem => ({
            itemId: item.itemId,
            name: item.name,
            location: item.location,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            value: item.value,
          })),
        };
      case 'recentSales':
        return {
          recentSales: update.data,
        };
      case 'customerValueRanking':
        return {
          customerSummary: update.data.map((customer): CustomerSummary => ({
            customerName: customer.customerName,
            customerEmail: customer.customerEmail,
            salesCount: customer.salesCount,
            totalUnits: customer.totalUnits,
            totalValue: customer.totalValue,
          })),
        };
      case 'inventoryRiskExposure':
        return {
          atRiskItems: update.data.map((item): RiskItem => ({
            itemId: item.itemId,
            name: item.name,
            location: item.location,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            atRiskValue: item.atRiskValue,
            targetQuantity: item.targetQuantity,
            riskScore: item.riskScore,
            riskLevel: item.riskLevel,
          })),
        };
      case 'error':
        return {};
    }
  }

}
