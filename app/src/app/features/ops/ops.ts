import { Component, OnInit, inject, signal } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BreadcrumbService } from '../../shared/navigation/breadcrumb.service';

@Component({
  selector: 'app-ops',
  imports: [ProgressSpinnerModule],
  templateUrl: './ops.html',
  styleUrl: './ops.css',
})
export class Ops implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);

  loading = signal(false);

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([{ label: 'Ops Pulse', url: '/ops' }]);
  }
}
