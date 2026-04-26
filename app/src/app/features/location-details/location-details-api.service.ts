import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
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

  fetchLocationDetail(location: string) {
    return this.http.get<ItemsApiResponse>(`${this.apiBaseUrl}/items`).pipe(
      map((response) => {
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
        const totalUnits = itemDetails.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = itemDetails.reduce((sum, item) => sum + item.value, 0);

        return {
          location,
          itemCount: itemDetails.length,
          totalUnits,
          totalValue,
          items: itemDetails,
          typeBreakdown,
        } satisfies LocationInventoryDetail;
      }),
    );
  }
}
