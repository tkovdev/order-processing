import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BreadcrumbService } from '../../shared/navigation/breadcrumb.service';
import { LocationInventorySummary, LocationsApiService } from './locations-api.service';

@Component({
  selector: 'app-locations',
  imports: [CommonModule, RouterLink, ProgressSpinnerModule],
  templateUrl: './locations.html',
  styleUrl: './locations.css',
})
export class Locations implements OnInit, OnDestroy {
  private readonly locationsApi = inject(LocationsApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly destroy$ = new Subject<void>();

  loading = signal(true);
  errorMessage = signal('');
  sortState = signal<{
    column: 'location' | 'itemCount' | 'quantity' | 'value';
    direction: 'asc' | 'desc';
  }>({
    column: 'value',
    direction: 'desc',
  });
  locationRows = signal<LocationInventorySummary[]>([]);

  totals = computed(() => {
    const locations = this.locationRows();
    return {
      locationCount: locations.length,
      totalItemTypes: locations.reduce((sum, location) => sum + location.itemCount, 0),
      totalUnits: locations.reduce((sum, location) => sum + location.quantity, 0),
      totalValue: locations.reduce((sum, location) => sum + location.value, 0),
    };
  });

  sortedLocationRows = computed(() => {
    const { column, direction } = this.sortState();
    const sortMultiplier = direction === 'asc' ? 1 : -1;

    return [...this.locationRows()].sort((left, right) => {
      if (column === 'location') {
        return left.location.localeCompare(right.location) * sortMultiplier;
      }

      const byMetric = (left[column] - right[column]) * sortMultiplier;
      if (byMetric !== 0) {
        return byMetric;
      }

      return left.location.localeCompare(right.location);
    });
  });

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([{ label: 'Locations', url: '/locations' }]);

    this.loadLocationSummary();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshNow(): void {
    this.loadLocationSummary();
  }

  toggleSort(column: 'location' | 'itemCount' | 'quantity' | 'value'): void {
    const currentSort = this.sortState();
    if (currentSort.column !== column) {
      this.sortState.set({ column, direction: column === 'location' ? 'asc' : 'desc' });
      return;
    }

    this.sortState.set({
      column,
      direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
    });
  }

  getSortIndicator(column: 'location' | 'itemCount' | 'quantity' | 'value'): string {
    const currentSort = this.sortState();
    if (currentSort.column !== column) {
      return '↕';
    }

    return currentSort.direction === 'asc' ? '↑' : '↓';
  }

  isSortedBy(column: 'location' | 'itemCount' | 'quantity' | 'value'): boolean {
    return this.sortState().column === column;
  }

  toLocationSlug(location: string): string {
    return location
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private loadLocationSummary(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.locationsApi
      .fetchLocationSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (locations) => {
          this.locationRows.set(locations);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('Unable to load location inventory data from the API.');
          this.loading.set(false);
        },
      });
  }

}
