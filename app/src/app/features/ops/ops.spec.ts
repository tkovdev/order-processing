import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ops } from './ops';

describe('Ops', () => {
  let component: Ops;
  let fixture: ComponentFixture<Ops>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ops],
    }).compileComponents();

    fixture = TestBed.createComponent(Ops);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', async () => {
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  it('should not be in loading state after init', async () => {
    await fixture.whenStable();
    expect(component.loading()).toBe(false);
  });

  it('should render the page heading', async () => {
    await fixture.whenStable();
    const h1: HTMLElement = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Ops Pulse');
  });

  it('should render status, timeline, and KPI zones', async () => {
    await fixture.whenStable();
    const zones: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.ops-zone');
    expect(zones.length).toBe(3);
  });
});
