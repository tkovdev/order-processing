import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BreadcrumbService } from '../../shared/navigation/breadcrumb.service';

@Component({
  selector: 'app-sales',
  imports: [CommonModule, ProgressSpinnerModule],
  templateUrl: './sales.html',
  styleUrl: './sales.css',
})
export class Sales implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);

  loading = signal(true);

  dateFilter = signal('');
  statusFilter = signal('');
  searchFilter = signal('');

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([{ label: 'Sales', url: '/sales' }]);

    // Placeholder: resolve loading state once shell is ready
    this.loading.set(false);
  }
}
