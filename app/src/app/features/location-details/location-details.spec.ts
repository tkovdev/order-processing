import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { LocationDetails } from './location-details';

describe('LocationDetails', () => {
  let component: LocationDetails;
  let fixture: ComponentFixture<LocationDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationDetails],
      providers: [provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
