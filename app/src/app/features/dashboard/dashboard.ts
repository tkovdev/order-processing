import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subject, interval, of } from 'rxjs';
import { catchError, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { DashboardApiService, CustomerValueRanking, InventoryRiskExposure, LocationInventorySummary, OperationsSummary, RecentSale, TopValueItem } from './dashboard-api.service';

interface InventoryByLocation {
  location: string;
  itemCount: number;
  quantity: number;
  value: number;
}

interface TopItem {
  itemId: string;
  name: string;
  location: string;
  quantity: number;
  unitPrice: number;
  value: number;
}


interface CustomerSummary {
  customerName: string;
  customerEmail: string;
  salesCount: number;
  totalUnits: number;
  totalValue: number;
}

interface RiskItem {
  itemId: string;
  name: string;
  location: string;
  quantity: number;
  unitPrice: number;
  atRiskValue: number;
  targetQuantity: number;
  riskScore: number;
  riskLevel: string;
}

interface DashboardViewModel {
  totalInventoryQuantity: number;
  totalInventoryValue: number;
  totalSales: number;
  submittedSales: number;
  completedSales: number;
  inventoryByLocation: InventoryByLocation[];
  topValueItems: TopItem[];
  recentSales: RecentSale[];
  customerSummary: CustomerSummary[];
  atRiskItems: RiskItem[];
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ProgressSpinnerModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly destroy$ = new Subject<void>();

  private readonly refreshMs = 30_000;

  loading = signal(true);
  errorMessage = signal('');
  lastUpdated = signal<Date | null>(null);

  model = signal<DashboardViewModel>({
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
  });

  ngOnInit(): void {
    interval(this.refreshMs)
      .pipe(
        startWith(0),
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
    this.fetchDashboardData().pipe(takeUntil(this.destroy$)).subscribe();
  }

  private fetchDashboardData() {
    this.loading.set(true);
    this.errorMessage.set('');

    return this.dashboardApi.fetchDashboardData().pipe(
      catchError((error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set('Unable to load dashboard data from the API.');
        return of({
          operationsSummary: {
            totalInventoryQuantity: 0,
            totalInventoryValue: 0,
            totalSales: 0,
            submittedSales: 0,
            completedSales: 0,
          } as OperationsSummary,
          locationSummary: [] as LocationInventorySummary[],
          topValueItems: [] as TopValueItem[],
          recentSales: [] as RecentSale[],
          customerValueRanking: [] as CustomerValueRanking[],
          inventoryRiskExposure: [] as InventoryRiskExposure[],
          error,
        });
      }),
      switchMap(({ operationsSummary, locationSummary, topValueItems, recentSales, customerValueRanking, inventoryRiskExposure }) => {
        this.model.set(this.buildViewModel(operationsSummary, locationSummary, topValueItems, recentSales, customerValueRanking, inventoryRiskExposure));
        this.lastUpdated.set(new Date());
        this.loading.set(false);

        return of(null);
      }),
    );
  }

  private buildViewModel(summary: OperationsSummary, locationSummary: LocationInventorySummary[], topValueItems: TopValueItem[], recentSales: RecentSale[], customerValueRanking: CustomerValueRanking[], inventoryRiskExposure: InventoryRiskExposure[]): DashboardViewModel {
    const {
      totalInventoryQuantity,
      totalInventoryValue,
      totalSales,
      submittedSales,
      completedSales,
    } = summary;

    const inventoryByLocation = [...locationSummary].sort((a, b) => b.value - a.value);

    const topItems: TopItem[] = topValueItems.map((item) => ({
      itemId: item.itemId,
      name: item.name,
      location: item.location,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      value: item.value,
    }));

    const customerSummary: CustomerSummary[] = customerValueRanking.map((customer) => ({
      customerName: customer.customerName,
      customerEmail: customer.customerEmail,
      salesCount: customer.salesCount,
      totalUnits: customer.totalUnits,
      totalValue: customer.totalValue,
    }));

    const atRiskItems: RiskItem[] = inventoryRiskExposure.map((item) => ({
      itemId: item.itemId,
      name: item.name,
      location: item.location,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      atRiskValue: item.atRiskValue,
      targetQuantity: item.targetQuantity,
      riskScore: item.riskScore,
      riskLevel: item.riskLevel,
    }));

    return {
      totalInventoryQuantity,
      totalInventoryValue,
      totalSales,
      submittedSales,
      completedSales,
      inventoryByLocation,
      topValueItems: topItems,
      recentSales,
      customerSummary,
      atRiskItems,
    };
  }

}
