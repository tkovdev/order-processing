import { Component, OnInit, inject } from '@angular/core';
import { BreadcrumbService } from '../../shared/navigation/breadcrumb.service';

@Component({
  selector: 'app-locations',
  imports: [],
  templateUrl: './locations.html',
  styleUrl: './locations.css',
})
export class Locations implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Locations', url: '/locations' },
    ]);
  }

}
