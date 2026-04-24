import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subject, interval, of } from 'rxjs';
import { catchError, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { DashboardApiService, OperationsSummary } from './dashboard-api.service';

type SaleStatus = 'submitted' | 'completed' | string;

interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  location: string;
  type: string;
}

interface SaleLine {
  itemId: string;
  quantity: number;
}

interface Sale {
  id: string;
  status: SaleStatus;
  customer: {
    name: string;
    email: string;
    address: string;
  };
  items: SaleLine[];
}

interface InventoryByLocation {
  location: string;
  itemCount: number;
  quantity: number;
  value: number;
}

interface TopItem {
  name: string;
  location: string;
  quantity: number;
  value: number;
}

interface RecentSale {
  customerName: string;
  customerEmail: string;
  status: SaleStatus;
  lineCount: number;
  totalUnits: number;
  totalValue: number;
}

interface CustomerSummary {
  customerName: string;
  customerEmail: string;
  salesCount: number;
  totalUnits: number;
  totalValue: number;
}

interface RiskItem {
  name: string;
  location: string;
  quantity: number;
  unitPrice: number;
  atRiskValue: number;
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
          itemsResponse: { items: [] },
          salesResponse: { sales: [] },
          operationsSummary: {
            totalInventoryQuantity: 0,
            totalInventoryValue: 0,
            totalSales: 0,
            submittedSales: 0,
            completedSales: 0,
          } as OperationsSummary,
          error,
        });
      }),
      switchMap(({ itemsResponse, salesResponse, operationsSummary }) => {
        const items = this.normalizeItems(itemsResponse.items ?? []);
        const sales = this.normalizeSales(salesResponse.sales ?? []);

        this.model.set(this.buildViewModel(items, sales, operationsSummary));
        this.lastUpdated.set(new Date());
        this.loading.set(false);

        return of(null);
      }),
    );
  }

  private buildViewModel(items: Item[], sales: Sale[], summary: OperationsSummary): DashboardViewModel {
    const priceByItemId = new Map<string, number>(items.map((item) => [item.id, item.price]));

    const {
      totalInventoryQuantity,
      totalInventoryValue,
      totalSales,
      submittedSales,
      completedSales,
    } = summary;

    const locationMap = new Map<string, InventoryByLocation>();
    for (const item of items) {
      const key = item.location || 'Unassigned';
      const existing = locationMap.get(key);
      if (existing) {
        existing.itemCount += 1;
        existing.quantity += item.quantity;
        existing.value += item.quantity * item.price;
      } else {
        locationMap.set(key, {
          location: key,
          itemCount: 1,
          quantity: item.quantity,
          value: item.quantity * item.price,
        });
      }
    }

    const inventoryByLocation = Array.from(locationMap.values()).sort(
      (a, b) => b.value - a.value,
    );

    const topValueItems = items
      .map((item) => ({
        name: item.name,
        location: item.location,
        quantity: item.quantity,
        value: item.price * item.quantity,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const recentSales = [...sales]
      .reverse()
      .slice(0, 10)
      .map((sale) => {
        const totalUnits = sale.items.reduce((sum, line) => sum + line.quantity, 0);
        const totalValue = sale.items.reduce(
          (sum, line) => sum + (priceByItemId.get(line.itemId) ?? 0) * line.quantity,
          0,
        );

        return {
          customerName: sale.customer.name,
          customerEmail: sale.customer.email,
          status: sale.status,
          lineCount: sale.items.length,
          totalUnits,
          totalValue,
        };
      });

    const customerMap = new Map<string, CustomerSummary>();
    for (const sale of sales) {
      const emailKey = sale.customer.email || sale.id;
      const totalUnits = sale.items.reduce((sum, line) => sum + line.quantity, 0);
      const totalValue = sale.items.reduce(
        (sum, line) => sum + (priceByItemId.get(line.itemId) ?? 0) * line.quantity,
        0,
      );

      const existing = customerMap.get(emailKey);
      if (existing) {
        existing.salesCount += 1;
        existing.totalUnits += totalUnits;
        existing.totalValue += totalValue;
      } else {
        customerMap.set(emailKey, {
          customerName: sale.customer.name,
          customerEmail: sale.customer.email,
          salesCount: 1,
          totalUnits,
          totalValue,
        });
      }
    }

    const customerSummary = Array.from(customerMap.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 8);

    const atRiskItems = items
      .filter((item) => item.quantity <= 20 && item.price >= 100)
      .map((item) => ({
        name: item.name,
        location: item.location,
        quantity: item.quantity,
        unitPrice: item.price,
        atRiskValue: item.quantity * item.price,
      }))
      .sort((a, b) => b.atRiskValue - a.atRiskValue)
      .slice(0, 6);

    return {
      totalInventoryQuantity,
      totalInventoryValue,
      totalSales,
      submittedSales,
      completedSales,
      inventoryByLocation,
      topValueItems,
      recentSales,
      customerSummary,
      atRiskItems,
    };
  }

  private normalizeItems(payload: unknown[]): Item[] {
    return payload
      .map((raw) => {
        const source = raw as Record<string, unknown>;
        const id = this.readString(source, '_id') || this.readString(source, 'id');
        const name = this.readString(source, 'name');
        const price = this.readNumber(source, 'price');
        const quantity = this.readNumber(source, 'quantity');

        if (!id || !name || price === null || quantity === null) {
          return null;
        }

        return {
          id,
          name,
          price,
          quantity,
          location: this.readString(source, 'location') || 'Unassigned',
          type: this.readString(source, 'type') || 'unknown',
        };
      })
      .filter((item): item is Item => item !== null);
  }

  private normalizeSales(payload: unknown[]): Sale[] {
    return payload
      .map((raw) => {
        const source = raw as Record<string, unknown>;
        const id = this.readString(source, '_id') || this.readString(source, 'id');
        const status = this.readString(source, 'status') || 'submitted';
        const customerRaw = (source['customer'] ?? {}) as Record<string, unknown>;
        const itemsRaw = Array.isArray(source['items']) ? source['items'] : [];

        if (!id) {
          return null;
        }

        const items: SaleLine[] = itemsRaw
          .map((line) => {
            const lineSource = line as Record<string, unknown>;
            const itemId = this.readString(lineSource, 'itemId');
            const quantity = this.readNumber(lineSource, 'quantity');

            if (!itemId || quantity === null) {
              return null;
            }

            return { itemId, quantity };
          })
          .filter((line): line is SaleLine => line !== null);

        return {
          id,
          status,
          customer: {
            name: this.readString(customerRaw, 'name') || 'Unknown Customer',
            email: this.readString(customerRaw, 'email') || 'unknown@example.com',
            address: this.readString(customerRaw, 'address') || 'N/A',
          },
          items,
        };
      })
      .filter((sale): sale is Sale => sale !== null);
  }

  private readString(source: Record<string, unknown>, key: string): string | null {
    const value = source[key];
    return typeof value === 'string' ? value : null;
  }

  private readNumber(source: Record<string, unknown>, key: string): number | null {
    const value = source[key];
    return typeof value === 'number' ? value : null;
  }

}
