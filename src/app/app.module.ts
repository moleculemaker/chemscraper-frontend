import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { InputTextareaModule } from 'primeng/inputtextarea';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';

import { ConfigurationComponent} from './components/configuration/configuration.component';
import { ResultsComponent } from './components/results/results.component';

import { SequenceService } from './sequence.service';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    ConfigurationComponent,
    ResultsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    InputTextareaModule,
    TableModule,
    ButtonModule,
    ProgressBarModule,
    SkeletonModule,
    HttpClientModule
  ],
  providers: [SequenceService],
  bootstrap: [AppComponent]
})
export class AppModule { }
