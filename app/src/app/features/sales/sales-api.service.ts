import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

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

@Injectable({
  providedIn: 'root',
})
export class SalesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getRecentSales(limit: number) {
    return this.http.get<RecentSale[]>(`${this.apiBaseUrl}/sales/recent`, {
      params: { limit: limit.toString() },
    });
  }
}
