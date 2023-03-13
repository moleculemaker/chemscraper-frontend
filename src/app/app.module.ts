import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PanelModule } from 'primeng/panel';
import { PrimeIcons} from 'primeng/api';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { FileUploadModule } from 'primeng/fileupload';


import { LandingPageComponent} from './components/landing-page/landing-page.component';

import { ConfigurationComponent} from './components/clean/configuration/configuration.component';
import { ResultsComponent } from './components/clean/results/results.component';

import { SequenceService } from './sequence.service';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,

    LandingPageComponent,

    ConfigurationComponent,
    ResultsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,

    ButtonModule,
    InputTextareaModule,
    PanelModule,
    ProgressBarModule,
    SelectButtonModule,
    SkeletonModule,
    TableModule,
    FileUploadModule,
    PanelModule,
    BrowserAnimationsModule,
    HttpClientModule
  ],
  providers: [SequenceService],
  bootstrap: [AppComponent]
})
export class AppModule { }
