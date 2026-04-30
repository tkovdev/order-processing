import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subject, merge, of, timer } from 'rxjs';
import { catchError, finalize, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { BreadcrumbService } from '../../shared/navigation/breadcrumb.service';
import { ContainerStatus, KafkaEvent, OpsApiService } from './ops-api.service';

const POLL_INTERVAL_MS = 30_000;

export interface KafkaEventGroup {
  correlationId: string;
  events: KafkaEvent[];
  latestTimestamp: Date;
}

@Component({
  selector: 'app-ops',
  imports: [CommonModule, ProgressSpinnerModule],
  templateUrl: './ops.html',
  styleUrl: './ops.css',
})
export class Ops implements OnInit, OnDestroy {
  private readonly opsApi = inject(OpsApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly destroy$ = new Subject<void>();
  private readonly manualRefresh$ = new Subject<void>();

  loading = signal(true);
  errorMessage = signal('');
  lastUpdated = signal<Date | null>(null);
  containers = signal<ContainerStatus[]>([]);
  kafkaEvents = signal<KafkaEvent[]>([]);

  topicFilter = signal('');
  typeFilter = signal('');
  correlationFilter = signal('');

  filteredGroups = computed<KafkaEventGroup[]>(() => {
    const topic = this.topicFilter().trim().toLowerCase();
    const type = this.typeFilter().trim().toLowerCase();
    const correlation = this.correlationFilter().trim().toLowerCase();

    const filtered = this.kafkaEvents().filter((e) => {
      if (topic && !e.topic.toLowerCase().includes(topic)) return false;
      if (type && !e.type.toLowerCase().includes(type)) return false;
      if (correlation && !(e.correlationId ?? '').toLowerCase().includes(correlation)) return false;
      return true;
    });

    const groups = new Map<string, KafkaEvent[]>();
    for (const event of filtered) {
      const id = event.correlationId ?? 'unknown';
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id)!.push(event);
    }

    return Array.from(groups.entries())
      .map(([correlationId, events]) => {
        const sorted = [...events].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
        const latestTimestamp = new Date(sorted.at(-1)!.timestamp);
        return { correlationId, events: sorted, latestTimestamp };
      })
      .sort((a, b) => b.latestTimestamp.getTime() - a.latestTimestamp.getTime());
  });

  availableTopics = computed(() => Array.from(new Set(this.kafkaEvents().map((e) => e.topic))).sort());
  availableTypes = computed(() => Array.from(new Set(this.kafkaEvents().map((e) => e.type))).sort());

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([{ label: 'Ops Pulse', url: '/ops' }]);

    merge(timer(0, POLL_INTERVAL_MS), this.manualRefresh$)
      .pipe(
        switchMap(() => merge(this.fetchContainerStatuses(), this.fetchKafkaEvents())),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshNow(): void {
    this.manualRefresh$.next();
  }

  healthClass(container: ContainerStatus): string {
    const health = container.health;
    if (health === 'healthy') return 'status-healthy';
    if (health === 'unhealthy') return 'status-unhealthy';
    if (health === 'starting') return 'status-starting';
    const status = container.status;
    if (status === 'running') return 'status-running';
    if (status === 'exited' || status === 'stopped') return 'status-stopped';
    return 'status-unknown';
  }

  healthLabel(container: ContainerStatus): string {
    const health = container.health;
    if (health !== 'none' && health !== 'unknown') return health;
    return container.status;
  }

  private fetchContainerStatuses() {
    this.loading.set(true);
    this.errorMessage.set('');

    return this.opsApi.fetchContainerStatuses().pipe(
      tap((response) => {
        this.containers.set(response.services);
        this.lastUpdated.set(new Date(response.updatedAt));
      }),
      catchError(() => {
        this.errorMessage.set('Unable to load container status from the API.');
        return of(null);
      }),
      finalize(() => this.loading.set(false)),
      map(() => null),
    );
  }

  private fetchKafkaEvents() {
    return this.opsApi.fetchRecentKafkaEvents().pipe(
      tap((response) => this.kafkaEvents.set(response.messages)),
      catchError(() => of(null)),
      map(() => null),
    );
  }
}
