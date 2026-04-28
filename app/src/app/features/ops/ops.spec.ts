import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Ops } from './ops';
import { ContainerStatus, ContainerStatusResponse, OpsApiService } from './ops-api.service';

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

describe('Ops', () => {
  let component: Ops;
  let fixture: ComponentFixture<Ops>;
  let opsApiSpy: { fetchContainerStatuses: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.useFakeTimers();

    opsApiSpy = {
      fetchContainerStatuses: vi.fn().mockReturnValue(of(makeResponse())),
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
    const emptyState: HTMLElement = fixture.nativeElement.querySelector('.empty-state');
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
});
