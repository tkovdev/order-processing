import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LocationInventoryItemDetail {
  itemId: string;
  sku: string;
  name: string;
  type: string;
  quantity: number;
  unitPrice: number;
  value: number;
}

export interface LocationTypeSummary {
  type: string;
  itemCount: number;
  quantity: number;
  value: number;
}

export interface LocationInventoryDetail {
  location: string;
  itemCount: number;
  totalUnits: number;
  totalValue: number;
  items: LocationInventoryItemDetail[];
  typeBreakdown: LocationTypeSummary[];
}

export interface LocationInventorySummaryData {
  itemCount: number;
  totalUnits: number;
  totalValue: number;
}

export interface LocationInventorySummaryResponse {
  location: string;
  inventorySummary: LocationInventorySummaryData;
}

interface ItemApiRecord {
  _id?: string;
  sku: string;
  name: string;
  type: string;
  quantity: number;
  price: number;
  location: string;
}

interface ItemsApiResponse {
  items: ItemApiRecord[];
}

@Injectable({
  providedIn: 'root',
})
export class LocationDetailsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  fetchLocationSummary(location: string) {
    return this.http
      .get<LocationInventorySummaryResponse[]>(
        `${this.apiBaseUrl}/inventory/locations/${encodeURIComponent(location)}/summary`,
      )
      .pipe(
        map((results) => results[0] ?? null),
      );
  }

  fetchLocationDetail(location: string) {
    return forkJoin([
      this.fetchLocationSummary(location),
      this.http.get<ItemsApiResponse>(`${this.apiBaseUrl}/items`),
    ]).pipe(
      map(([summary, response]) => {
        const locationItems = response.items
          .filter((item) => item.location.toLowerCase() === location.toLowerCase())
          .sort((left, right) => left.name.localeCompare(right.name));

        const itemDetails: LocationInventoryItemDetail[] = locationItems.map((item) => ({
          itemId: item._id ?? '',
          sku: item.sku,
          name: item.name,
          type: item.type,
          quantity: item.quantity,
          unitPrice: item.price,
          value: item.quantity * item.price,
        }));

        const typeMap = new Map<string, LocationTypeSummary>();
        for (const item of itemDetails) {
          const existing = typeMap.get(item.type);
          if (!existing) {
            typeMap.set(item.type, {
              type: item.type,
              itemCount: 1,
              quantity: item.quantity,
              value: item.value,
            });
            continue;
          }

          existing.itemCount += 1;
          existing.quantity += item.quantity;
          existing.value += item.value;
        }

        const typeBreakdown = [...typeMap.values()].sort((left, right) => right.value - left.value);

        return {
          location,
          itemCount: summary?.inventorySummary.itemCount ?? itemDetails.length,
          totalUnits: summary?.inventorySummary.totalUnits ?? itemDetails.reduce((sum, item) => sum + item.quantity, 0),
          totalValue: summary?.inventorySummary.totalValue ?? itemDetails.reduce((sum, item) => sum + item.value, 0),
          items: itemDetails,
          typeBreakdown,
        } satisfies LocationInventoryDetail;
      }),
    );
  }
}
