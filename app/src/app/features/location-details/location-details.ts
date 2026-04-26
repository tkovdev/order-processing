import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BreadcrumbService } from '../../shared/navigation/breadcrumb.service';

@Component({
  selector: 'app-location-details',
  imports: [CommonModule],
  templateUrl: './location-details.html',
  styleUrl: './location-details.css',
})
export class LocationDetails implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly route = inject(ActivatedRoute);

  locationId = '';

  ngOnInit(): void {
    this.locationId = this.route.snapshot.paramMap.get('locationId') ?? '';

    this.breadcrumbService.setBreadcrumbs([
      { label: 'Locations', url: '/locations' },
      { label: this.toLabel(this.locationId), url: `/locations/${this.locationId}` },
    ]);
  }

  private toLabel(slug: string): string {
    return slug
      .split('-')
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }
}
