import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SequenceService } from 'src/app/sequence.service';
import { TrackingService } from 'src/app/tracking.service';
import { Message } from 'primeng/api';
import { switchMap } from 'rxjs/operators';

import { PostResponse, PostSeqData, SingleSeqData, ExampleData } from '../../../models';
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
  isValid: boolean = false;
  isValidating: boolean = false;
  hasChanged: boolean = false;
  postRespond: PostResponse;
  sendData: string[] = [];
  userEmail: string;
  private maxSeqNum: number = 20;
  disableCopyPaste: boolean = false;
  highTrafficMessage: Message[];
  uploaded_files: File[] = [];
  ref: DynamicDialogRef;


  inputMethods = [
    { label: 'Upload File', icon: 'pi pi-upload', value: 'upload_file' },
    { label: 'Use Example PDF', icon: 'pi pi-file-pdf', value: 'use_example' },
  ];
  selectedInputMethod: any | null = 'upload_file'; //this.inputMethods[0];

  exampleData: ExampleData[] = [];

  seqNum: number = 0;
  private validAminoAcid = new RegExp("[^GPAVLIMCFYWHKRQNEDST]", "i");
  realSendData: PostSeqData = {
    input_fasta: [],
    user_email: '',
    captcha_token: ''
  };

  constructor(
    private router: Router,
    private _sequenceService: SequenceService,
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
    // console.log(this.realSendData);
    // if the user uses example file, return precompiled result
    // else send sequence to backend, jump to results page
    console.log(this.selectedInputMethod);

    if (this.selectedInputMethod == 'use_example') {
      let label = "Example_PDF"
      this._sequenceService.getExampleResponse(label)
        .subscribe( data => {
          this.router.navigate(['/results', data.jobId]);
        });
    }
    // } else {
    //   this.hcaptchaService.verify().pipe(
    //     switchMap((data) => {
    //       this.realSendData.captcha_token = data;
    //       return this._sequenceService.getResponse(this.realSendData);
    //     })
    //   ).subscribe(
    //     (data) => {
    //       this.router.navigate(['/results', data.jobId, String(this.seqNum)]);
    //     },
    //     (error) => {
    //       // TODO replace this with a call to the message service, and display the correct error message
    //       console.error('Error getting contacts via subscribe() method:', error);
    //     }
    //   );
    // }
  }

  enterEmail() {
    this.realSendData.user_email = this.userEmail;
  }

  onFileSelected(e: Event){
    let upload_fileList = (e.target as HTMLInputElement).files;
    if(upload_fileList){
      Array.from(upload_fileList).forEach((file) => {
        if(file.type === 'application/pdf')
        this.uploaded_files.push(file);
      });
    }
    console.log(this.uploaded_files);
  }

  onFileDropped(files: FileList){
    Array.from(files).forEach((file) => {
      if(file.type === 'application/pdf')
      this.uploaded_files.push(file);
    });
    console.log(this.uploaded_files);
  }

  deleteFile(index: number){
    this.uploaded_files.splice(index, 1);
  }

  viewFile(index: number){
    console.log(this.uploaded_files[index]);

    const fileReader = new FileReader();
    fileReader.onload = () => {
      // console.log(fileReader.result);
      if(fileReader.result instanceof ArrayBuffer){
        this.ref = this.dialogService.open(PdfViewerDialogServiceComponent, {
          height:'60%',
          data:{
            pdfData: new Uint8Array(fileReader.result)
          }
        });
      }

    };
    fileReader.readAsArrayBuffer(this.uploaded_files[index]);

  }

}
