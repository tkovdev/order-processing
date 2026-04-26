import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BreadcrumbService } from '../../shared/navigation/breadcrumb.service';
import { LocationDetailsApiService, LocationInventoryDetail } from './location-details-api.service';

@Component({
  selector: 'app-location-details',
  imports: [CommonModule, ProgressSpinnerModule],
  templateUrl: './location-details.html',
  styleUrl: './location-details.css',
})
export class LocationDetails implements OnInit, OnDestroy {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly route = inject(ActivatedRoute);
  private readonly locationDetailsApi = inject(LocationDetailsApiService);
  private readonly destroy$ = new Subject<void>();

  locationId = '';
  locationLabel = '';
  loading = signal(true);
  errorMessage = signal('');
  detail = signal<LocationInventoryDetail | null>(null);

  stats = computed(() => {
    const detail = this.detail();
    return {
      itemTypes: detail?.itemCount ?? 0,
      totalUnits: detail?.totalUnits ?? 0,
      totalValue: detail?.totalValue ?? 0,
    };
  });

  totalItems = computed(() => this.detail()?.items.length ?? 0);

  demandNarrative = computed(() => {
    const detail = this.detail();
    if (!detail || !detail.typeBreakdown.length) {
      return 'Demand planning will use sales velocity and available units at this location once demand linkage is enabled.';
    }

    const leadType = detail.typeBreakdown[0].type.replace('_', ' ');
    return `Planned demand routing will prioritize ${leadType} availability here and compare it against recent sales velocity.`;
  });

  ngOnInit(): void {
    this.locationId = this.route.snapshot.paramMap.get('locationId') ?? '';
    this.locationLabel = this.toLabel(this.locationId);

    this.breadcrumbService.setBreadcrumbs([
      { label: 'Locations', url: '/locations' },
      { label: this.locationLabel, url: `/locations/${this.locationId}` },
    ]);

    this.loadLocationDetail();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshNow(): void {
    this.loadLocationDetail();
  }

  formatTypeLabel(type: string): string {
    return type
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private toLabel(slug: string): string {
    return slug
      .split('-')
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private loadLocationDetail(): void {
    if (!this.locationLabel) {
      this.errorMessage.set('Location identifier is missing from the route.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.locationDetailsApi
      .fetchLocationDetail(this.locationLabel)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('Unable to load this location inventory snapshot from the API.');
          this.loading.set(false);
        },
      });
  }
}
