import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ConfigurationComponent } from './components/configuration/configuration.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { ResultsComponent } from './components/results/results.component';

const routes: Routes = [
  { path: 'configuration', component: ConfigurationComponent },
  { path: 'results', component: ResultsComponent },
  { path: 'results/:id', component: ResultsComponent },
  { path: '', component: LandingPageComponent },
//  { path: '', redirectTo: '/configuration', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
