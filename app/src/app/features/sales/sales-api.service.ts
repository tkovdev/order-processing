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

export interface SaleLineItem {
  _id: string;
  itemId: string;
  quantity: number;
  price: number;
}

export interface SaleDetail {
  _id: string;
  status: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    address: string;
  };
  items: SaleLineItem[];
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

  getSaleDetail(saleId: string) {
    return this.http.get<SaleDetail>(`${this.apiBaseUrl}/sales/${saleId}`);
  }

  processSale(saleId: string) {
    return this.http.post<{ message: string; sale: SaleDetail }>(
      `${this.apiBaseUrl}/sales/${saleId}/process`,
      {},
    );
  }
}
