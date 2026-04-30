import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { Locations } from './features/locations/locations';
import { LocationDetails } from './features/location-details/location-details';
import { Ops } from './features/ops/ops';
import { Sales } from './features/sales/sales';

export const routes: Routes = [
    {path: '', component: Dashboard},
    {path: 'locations', component: Locations},
    {path: 'locations/:locationId', component: LocationDetails},
    {path: 'ops', component: Ops},
    {path: 'sales', component: Sales}
];
