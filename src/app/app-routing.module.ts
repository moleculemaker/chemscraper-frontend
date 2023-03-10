import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ConfigurationComponent } from './components/clean/configuration/configuration.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { ResultsComponent } from './components/clean/results/results.component';

const routes: Routes = [
  { path: 'clean', component: ConfigurationComponent },
  { path: 'clean/results', component: ResultsComponent },
  { path: 'clean/results/:id', component: ResultsComponent },
  { path: '', component: LandingPageComponent },
//  { path: '', redirectTo: '/configuration', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
