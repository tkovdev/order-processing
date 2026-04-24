import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
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

@Injectable({
  providedIn: 'root',
})
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  fetchDashboardData() {
    return forkJoin({
      itemsResponse: this.http.get<{ items: unknown[] }>(`${this.apiBaseUrl}/items`),
      salesResponse: this.http.get<{ sales: unknown[] }>(`${this.apiBaseUrl}/sales`),
      operationsSummary: this.http.get<OperationsSummary>(
        `${this.apiBaseUrl}/metrics/operations/summary`,
      ),
      locationSummary: this.http.get<LocationInventorySummary[]>(
        `${this.apiBaseUrl}/inventory/locations/summary`,
      ),
    });
  }
}