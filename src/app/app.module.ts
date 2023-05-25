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
import { MessagesModule } from 'primeng/messages';


import { LandingPageComponent} from './components/landing-page/landing-page.component';

import { ConfigurationComponent} from './components/chemscraper/configuration/configuration.component';
import { ResultsComponent } from './components/chemscraper/results/results.component';

import { SequenceService } from './sequence.service';
import { HttpClientModule } from '@angular/common/http';
import { NgxMatomoTrackerModule } from '@ngx-matomo/tracker';
import { NgxMatomoRouterModule } from '@ngx-matomo/router';
import { NgHcaptchaModule } from 'ng-hcaptcha';
import { FileDragNDropDirective } from './components/chemscraper/configuration/file-drag-n-drop.directive';
import { PdfViewerComponent } from './components/chemscraper/pdf-viewer/pdf-viewer.component';
import { PdfViewerDialogServiceComponent } from './components/chemscraper/pdf-viewer-dialog-service/pdf-viewer-dialog-service.component';

@NgModule({
  declarations: [
    AppComponent,

    LandingPageComponent,
    FileDragNDropDirective,
    ConfigurationComponent,
    ResultsComponent,
    PdfViewerComponent,
    PdfViewerDialogServiceComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    MessagesModule,
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
    HttpClientModule,
    NgxMatomoTrackerModule.forRoot({
      siteId: 3,
      trackerUrl: 'https://matomo.mmli1.ncsa.illinois.edu/'
    }),
    NgxMatomoRouterModule,
    NgHcaptchaModule.forRoot({
      siteKey: '0b1663cb-26b9-4e6f-bfa9-352bdd3aeb9f',
      languageCode: 'en' // optional, will default to browser language
  })
  ],
  providers: [SequenceService],
  bootstrap: [AppComponent]
})
export class AppModule { }
