import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { merge, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface OperationsSummary {
  totalInventoryQuantity: number;
  totalInventoryValue: number;
  totalSales: number;
  submittedSales: number;
  completedSales: number;
}

export interface LocationInventorySummary {
  location: string;
  itemCount: number;
  quantity: number;
  value: number;
}

export interface TopValueItem {
  itemId: string;
  name: string;
  location: string;
  quantity: number;
  unitPrice: number;
  value: number;
}

export interface RecentSale {
  saleId: string;
  createdAt: string;
  status: string;
  customerName: string;
  customerEmail: string;
  lineCount: number;
  totalUnits: number;
  totalValue: number;
}

export interface CustomerValueRanking {
  customerName: string;
  customerEmail: string;
  salesCount: number;
  totalUnits: number;
  totalValue: number;
}

export interface InventoryRiskExposure {
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

export type DashboardDataUpdate =
  | { kind: 'operationsSummary'; data: OperationsSummary }
  | { kind: 'locationSummary'; data: LocationInventorySummary[] }
  | { kind: 'topValueItems'; data: TopValueItem[] }
  | { kind: 'recentSales'; data: RecentSale[] }
  | { kind: 'customerValueRanking'; data: CustomerValueRanking[] }
  | { kind: 'inventoryRiskExposure'; data: InventoryRiskExposure[] }
  | { kind: 'error'; error: unknown };

@Injectable({
  providedIn: 'root',
})
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  fetchDashboardDataUpdates() {
    return merge(
      this.http.get<OperationsSummary>(`${this.apiBaseUrl}/metrics/operations/summary`).pipe(
        map((data): DashboardDataUpdate => ({ kind: 'operationsSummary', data })),
        catchError((error: unknown) => of({ kind: 'error', error } as const)),
      ),
      this.http.get<LocationInventorySummary[]>(`${this.apiBaseUrl}/inventory/locations/summary`).pipe(
        map((data): DashboardDataUpdate => ({ kind: 'locationSummary', data })),
        catchError((error: unknown) => of({ kind: 'error', error } as const)),
      ),
      this.http.get<TopValueItem[]>(`${this.apiBaseUrl}/inventory/items/top-value?limit=5`).pipe(
        map((data): DashboardDataUpdate => ({ kind: 'topValueItems', data })),
        catchError((error: unknown) => of({ kind: 'error', error } as const)),
      ),
      this.http.get<RecentSale[]>(`${this.apiBaseUrl}/sales/recent?limit=10`).pipe(
        map((data): DashboardDataUpdate => ({ kind: 'recentSales', data })),
        catchError((error: unknown) => of({ kind: 'error', error } as const)),
      ),
      this.http.get<CustomerValueRanking[]>(`${this.apiBaseUrl}/customers/value-ranking?limit=8`).pipe(
        map((data): DashboardDataUpdate => ({ kind: 'customerValueRanking', data })),
        catchError((error: unknown) => of({ kind: 'error', error } as const)),
      ),
      this.http.get<InventoryRiskExposure[]>(
        `${this.apiBaseUrl}/inventory/risk/exposure?maxQty=20&minUnitPrice=100&limit=6`,
      ).pipe(
        map((data): DashboardDataUpdate => ({ kind: 'inventoryRiskExposure', data })),
        catchError((error: unknown) => of({ kind: 'error', error } as const)),
      ),
    );
  }
}