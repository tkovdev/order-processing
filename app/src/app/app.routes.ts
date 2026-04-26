import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { Locations } from './features/locations/locations';

export const routes: Routes = [
    {path: '', component: Dashboard},
    {path: 'locations', component: Locations}
];
