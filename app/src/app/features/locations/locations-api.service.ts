import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface LocationInventorySummary {
  location: string;
  itemCount: number;
  quantity: number;
  value: number;
}

@Injectable({
  providedIn: 'root',
})
export class LocationsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  fetchLocationSummary() {
    return this.http.get<LocationInventorySummary[]>(`${this.apiBaseUrl}/inventory/locations/summary`);
  }
}