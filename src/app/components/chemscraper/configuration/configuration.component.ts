import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChemScraperService } from 'src/app/chemscraper.service';
import { TrackingService } from 'src/app/tracking.service';
import { Message } from 'primeng/api';
import { switchMap } from 'rxjs/operators';

import { PostResponse, ChemScraperAnalyzeRequestBody, SingleSeqData, ExampleData } from '../../../models';
import { ResultsComponent } from '../results/results.component';
import { NgHcaptchaService } from "ng-hcaptcha";
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PdfViewerComponent } from '../pdf-viewer/pdf-viewer.component';
import { PdfViewerDialogServiceComponent } from '../pdf-viewer-dialog-service/pdf-viewer-dialog-service.component';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss'],
  providers: [DialogService]
})
export class ConfigurationComponent {
  // sequenceData: string = '>seq1\nAVLIMCFYWH\n>seq2\nLIMCFYWHKRQNED\n>seq3\nMCFYPARQNEDVLWHKRQ';
  sequenceData: string = '';
  validationText: string = '';
  hasChanged: boolean = false;
  postRespond: PostResponse;
  sendData: string[] = [];
  userEmail: string;
  disableCopyPaste: boolean = false;
  highTrafficMessage: Message[];
  uploaded_files: File[] = [];
  ref: DynamicDialogRef;
  jobID: string = ''

  inputMethods = [
    { label: 'Upload File', icon: 'pi pi-upload', value: 'upload_file' },
    { label: 'Example PDF', icon: 'pi pi-file-pdf', value: 'use_example' },
  ];
  selectedInputMethod: any | null = 'upload_file'; //this.inputMethods[0];

  exampleData: ExampleData[] = [];

  private validAminoAcid = new RegExp("[^GPAVLIMCFYWHKRQNEDST]", "i");

  requestBody: ChemScraperAnalyzeRequestBody = {
    jobId: '',
    user_email: '',
    captcha_token: '',
    fileList: []
  };

  constructor(
    private router: Router,
    private _chemScraperService: ChemScraperService,
    private httpClient: HttpClient,
    private trackingService: TrackingService,
    private hcaptchaService: NgHcaptchaService,
    private dialogService: DialogService
  ) { }

  ngOnInit() {
    this.highTrafficMessage = [
      { severity: 'info', detail: 'Due to the overwhelming popularity of the ChemScraper tool, we are temporarily unable to predict EC numbers for new sequences. As we increase our capacity, please feel free to explore the tool with the example data we have provided, and visit us again soon!' },
    ];
  }

  clearAllFiles() {
    this.uploaded_files = [];
  }

  submitData() {
    if (this.selectedInputMethod == 'use_example') {
      let label = "example_PDF"
      this._chemScraperService.getExampleResponse(label)
        .subscribe( data => {
          this.router.navigate(['/results', data.jobId]);
        });
    } else {
      this.hcaptchaService.verify().pipe(
        switchMap((data) => {
          this.requestBody.captcha_token = data;
          this.requestBody.jobId = this.jobID;
          const fileNames: string[] = this.uploaded_files.map(file => file.name);
          this.requestBody.fileList = fileNames;
          return this._chemScraperService.analyzeDocument(this.requestBody);
        })
      ).subscribe(
        (res) => {
          this.router.navigate(['/results', this.jobID]);
        }
      );
    }
  }

  enterEmail() {
    this.requestBody.user_email = this.userEmail;
  }

  onFileSelected(e: Event){
    let upload_fileList = (e.target as HTMLInputElement).files;
    if(upload_fileList){
      Array.from(upload_fileList).forEach((file) => {
        if(file.type === 'application/pdf') {

          // File Upload
          const fd = new FormData();
          fd.append('file', file, file.name);
          console.log(this.jobID);

          this._chemScraperService.fileUpload(fd, this.jobID).subscribe(
            res => {
              this.jobID = res.jobID;
              this.uploaded_files.push(file);
            }
          );
        }
      });
    }
  }

  onFileDropped(files: FileList){
    Array.from(files).forEach((file) => {
      if(file.type === 'application/pdf') {

        // File Upload
        const fd = new FormData();
        fd.append('file', file, file.name);
        this._chemScraperService.fileUpload(fd, this.jobID).subscribe(
          res => {
            this.jobID = res.jobID;
            this.uploaded_files.push(file);
          }
        );
      }

    });
    // console.log(this.uploaded_files);
  }

  deleteFile(index: number){
    this.uploaded_files.splice(index, 1);
  }

  viewFile(index: number){
    this._chemScraperService.getInputPDf(this.jobID).subscribe(
      (urls) => {
        let pdfURLs = urls;
        if(pdfURLs.length > 0) {
          this.ref = this.dialogService.open(PdfViewerDialogServiceComponent, {
            height:'60%',
            data:{
              pdfURL: pdfURLs[0]
            }
          });
        }
      }
    );
  }

}
