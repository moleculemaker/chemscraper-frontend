import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ConfigurationComponent } from './components/configuration/configuration.component';
import { ResultsComponent } from './components/results/results.component';

const routes: Routes = [
  { path: 'configuration', component: ConfigurationComponent },
  { path: 'results', component: ResultsComponent },
  { path: '', redirectTo: '/configuration', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
