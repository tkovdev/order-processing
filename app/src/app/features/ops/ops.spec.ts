import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Ops } from './ops';
import {
  ContainerStatus,
  ContainerStatusResponse,
  KafkaEvent,
  KafkaEventsResponse,
  OpsApiService,
} from './ops-api.service';

const UPDATED_AT = '2026-04-28T12:00:00.000Z';

function makeContainer(overrides: Partial<ContainerStatus> = {}): ContainerStatus {
  return {
    name: 'api',
    status: 'running',
    startedAt: '2026-04-28T00:00:00Z',
    health: 'healthy',
    ...overrides,
  };
}

function makeResponse(
  services: ContainerStatus[] = [],
  updatedAt = UPDATED_AT,
): ContainerStatusResponse {
  return { services, updatedAt };
}

function makeKafkaEvent(overrides: Partial<KafkaEvent> = {}): KafkaEvent {
  return {
    correlationId: 'corr-1',
    topic: 'orders.state',
    type: 'ORDER_CREATED',
    service: 'orders',
    timestamp: '2026-04-28T12:00:00.000Z',
    ...overrides,
  };
}

function makeKafkaResponse(
  messages: KafkaEvent[] = [],
  updatedAt = UPDATED_AT,
): KafkaEventsResponse {
  return { messages, updatedAt };
}

describe('Ops', () => {
  let component: Ops;
  let fixture: ComponentFixture<Ops>;
  let opsApiSpy: {
    fetchContainerStatuses: ReturnType<typeof vi.fn>;
    fetchRecentKafkaEvents: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.useFakeTimers();

    opsApiSpy = {
      fetchContainerStatuses: vi.fn().mockReturnValue(of(makeResponse())),
      fetchRecentKafkaEvents: vi.fn().mockReturnValue(of(makeKafkaResponse())),
    };

    await TestBed.configureTestingModule({
      imports: [Ops],
      providers: [{ provide: OpsApiService, useValue: opsApiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(Ops);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function initAndFlush(): void {
    fixture.detectChanges();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
  }

  it('should create', () => {
    initAndFlush();
    expect(component).toBeTruthy();
  });

  it('should be in loading state on init before first fetch', () => {
    fixture.detectChanges();
    expect(component.loading()).toBe(true);
    vi.advanceTimersByTime(0);
  });

  it('should not be in loading state after successful fetch', () => {
    initAndFlush();
    expect(component.loading()).toBe(false);
  });

  it('should render the page heading', () => {
    initAndFlush();
    const h1: HTMLElement = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Ops Pulse');
  });

  it('should render status, timeline, and KPI zones', () => {
    initAndFlush();
    const zones: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.ops-zone');
    expect(zones.length).toBe(3);
  });

  it('should display container health chips when API returns services', () => {
    opsApiSpy.fetchContainerStatuses.mockReturnValue(
      of(makeResponse([
        makeContainer({ name: 'api', health: 'healthy' }),
        makeContainer({ name: 'worker', health: 'unhealthy' }),
      ])),
    );
    initAndFlush();
    const chips: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.health-chip');
    expect(chips.length).toBe(2);
  });

  it('should apply status-healthy class for healthy containers', () => {
    opsApiSpy.fetchContainerStatuses.mockReturnValue(
      of(makeResponse([makeContainer({ name: 'api', health: 'healthy' })])),
    );
    initAndFlush();
    const chip: HTMLElement = fixture.nativeElement.querySelector('.health-chip');
    expect(chip.classList).toContain('status-healthy');
  });

  it('should apply status-unhealthy class for unhealthy containers', () => {
    opsApiSpy.fetchContainerStatuses.mockReturnValue(
      of(makeResponse([makeContainer({ name: 'db', health: 'unhealthy' })])),
    );
    initAndFlush();
    const chip: HTMLElement = fixture.nativeElement.querySelector('.health-chip');
    expect(chip.classList).toContain('status-unhealthy');
  });

  it('should apply status-running class for running containers without a health check', () => {
    opsApiSpy.fetchContainerStatuses.mockReturnValue(
      of(makeResponse([makeContainer({ name: 'proxy', status: 'running', health: 'none' })])),
    );
    initAndFlush();
    const chip: HTMLElement = fixture.nativeElement.querySelector('.health-chip');
    expect(chip.classList).toContain('status-running');
  });

  it('should show empty state when API returns no services', () => {
    initAndFlush();
    const zones: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.ops-zone');
    const statusZone = zones[0];
    const emptyState: HTMLElement | null = statusZone.querySelector('.empty-state');
    expect(emptyState).not.toBeNull();
  });

  it('should show a non-blocking error warning when the API fails', () => {
    opsApiSpy.fetchContainerStatuses.mockReturnValue(throwError(() => new Error('Server Error')));
    initAndFlush();
    expect(component.errorMessage()).toBe('Unable to load container status from the API.');
    expect(component.loading()).toBe(false);
    fixture.detectChanges();
    const warning: HTMLElement = fixture.nativeElement.querySelector('.status-block.warning');
    expect(warning).not.toBeNull();
  });

  it('should display last updated timestamp after successful fetch', () => {
    opsApiSpy.fetchContainerStatuses.mockReturnValue(of(makeResponse([], UPDATED_AT)));
    initAndFlush();
    expect(component.lastUpdated()).not.toBeNull();
    expect(component.lastUpdated()!.toISOString()).toBe(UPDATED_AT);
  });

  it('should trigger a new fetch when refreshNow is called', () => {
    initAndFlush();
    expect(opsApiSpy.fetchContainerStatuses).toHaveBeenCalledTimes(1);

    component.refreshNow();
    fixture.detectChanges();

    expect(opsApiSpy.fetchContainerStatuses).toHaveBeenCalledTimes(2);
  });

  // Timeline tests

  it('should show empty timeline state when no kafka events are returned', () => {
    opsApiSpy.fetchRecentKafkaEvents.mockReturnValue(of(makeKafkaResponse([])));
    initAndFlush();
    const zones: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.ops-zone');
    const timelineZone = zones[1];
    const emptyState: HTMLElement | null = timelineZone.querySelector('.empty-state');
    expect(emptyState).not.toBeNull();
    expect(emptyState!.textContent).toContain('No timeline events to display.');
  });

  it('should render timeline groups when kafka events are present', () => {
    opsApiSpy.fetchRecentKafkaEvents.mockReturnValue(
      of(makeKafkaResponse([makeKafkaEvent()])),
    );
    initAndFlush();
    const groups: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.timeline-group');
    expect(groups.length).toBe(1);
  });

  it('should group events under the same correlation ID', () => {
    opsApiSpy.fetchRecentKafkaEvents.mockReturnValue(
      of(makeKafkaResponse([
        makeKafkaEvent({ correlationId: 'corr-1', type: 'ORDER_CREATED', timestamp: '2026-04-28T12:00:00.000Z' }),
        makeKafkaEvent({ correlationId: 'corr-1', type: 'ORDER_PAID', timestamp: '2026-04-28T12:00:01.000Z' }),
        makeKafkaEvent({ correlationId: 'corr-2', type: 'ORDER_CREATED', timestamp: '2026-04-28T12:00:02.000Z' }),
      ])),
    );
    initAndFlush();
    const groups: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.timeline-group');
    expect(groups.length).toBe(2);
    const items: NodeListOf<HTMLElement> = groups[1].querySelectorAll('.event-item');
    expect(items.length).toBe(2);
  });

  it('should sort groups so the most recently updated group appears first', () => {
    opsApiSpy.fetchRecentKafkaEvents.mockReturnValue(
      of(makeKafkaResponse([
        makeKafkaEvent({ correlationId: 'older', timestamp: '2026-04-28T11:00:00.000Z' }),
        makeKafkaEvent({ correlationId: 'newer', timestamp: '2026-04-28T13:00:00.000Z' }),
      ])),
    );
    initAndFlush();
    const headers: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll('.correlation-id');
    expect(headers[0].textContent?.trim()).toBe('newer');
    expect(headers[1].textContent?.trim()).toBe('older');
  });

  it('should filter timeline events by topic', () => {
    opsApiSpy.fetchRecentKafkaEvents.mockReturnValue(
      of(makeKafkaResponse([
        makeKafkaEvent({ correlationId: 'corr-1', topic: 'orders.state' }),
        makeKafkaEvent({ correlationId: 'corr-2', topic: 'sales.state' }),
      ])),
    );
    initAndFlush();

    component.topicFilter.set('orders.state');
    fixture.detectChanges();

    const groups: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.timeline-group');
    expect(groups.length).toBe(1);
    expect(groups[0].querySelector('.correlation-id')?.textContent?.trim()).toBe('corr-1');
  });

  it('should filter timeline events by type', () => {
    opsApiSpy.fetchRecentKafkaEvents.mockReturnValue(
      of(makeKafkaResponse([
        makeKafkaEvent({ correlationId: 'corr-1', type: 'ORDER_CREATED' }),
        makeKafkaEvent({ correlationId: 'corr-2', type: 'ORDER_SHIPPED' }),
      ])),
    );
    initAndFlush();

    component.typeFilter.set('ORDER_SHIPPED');
    fixture.detectChanges();

    const groups: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.timeline-group');
    expect(groups.length).toBe(1);
    expect(groups[0].querySelector('.correlation-id')?.textContent?.trim()).toBe('corr-2');
  });

  it('should filter timeline events by partial correlation ID', () => {
    opsApiSpy.fetchRecentKafkaEvents.mockReturnValue(
      of(makeKafkaResponse([
        makeKafkaEvent({ correlationId: 'abc-111' }),
        makeKafkaEvent({ correlationId: 'xyz-999' }),
      ])),
    );
    initAndFlush();

    component.correlationFilter.set('abc');
    fixture.detectChanges();

    const groups: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.timeline-group');
    expect(groups.length).toBe(1);
    expect(groups[0].querySelector('.correlation-id')?.textContent?.trim()).toBe('abc-111');
  });

  it('should show empty timeline state when filters match no events', () => {
    opsApiSpy.fetchRecentKafkaEvents.mockReturnValue(
      of(makeKafkaResponse([makeKafkaEvent({ topic: 'orders.state' })])),
    );
    initAndFlush();

    component.topicFilter.set('nonexistent.topic');
    fixture.detectChanges();

    const zones: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.ops-zone');
    const timelineZone = zones[1];
    const emptyState: HTMLElement | null = timelineZone.querySelector('.empty-state');
    expect(emptyState).not.toBeNull();
  });

  it('should populate availableTopics and availableTypes from kafka events', () => {
    opsApiSpy.fetchRecentKafkaEvents.mockReturnValue(
      of(makeKafkaResponse([
        makeKafkaEvent({ topic: 'orders.state', type: 'ORDER_CREATED' }),
        makeKafkaEvent({ topic: 'sales.state', type: 'SALE_IN_PROGRESS' }),
      ])),
    );
    initAndFlush();

    expect(component.availableTopics()).toEqual(['orders.state', 'sales.state']);
    expect(component.availableTypes()).toEqual(['ORDER_CREATED', 'SALE_IN_PROGRESS']);
  });

  it('should recover gracefully when kafka events fetch fails', () => {
    opsApiSpy.fetchRecentKafkaEvents.mockReturnValue(throwError(() => new Error('Kafka error')));
    initAndFlush();
    expect(component.kafkaEvents()).toEqual([]);
    expect(component.loading()).toBe(false);
  });
});
