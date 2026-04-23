import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

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
    });
  }
}