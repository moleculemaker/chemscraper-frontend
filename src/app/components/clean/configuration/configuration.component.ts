import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SequenceService } from 'src/app/sequence.service';
import { TrackingService } from 'src/app/tracking.service';
import { Message } from 'primeng/api';
import { switchMap } from 'rxjs/operators';

import { PostResponse, PostSeqData, SingleSeqData, ExampleData } from '../../../models';
import { ResultsComponent } from '../results/results.component';
import {NgHcaptchaService} from "ng-hcaptcha";

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
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

  inputMethods = [
    { label: 'Copy and Paste', icon: 'pi pi-copy', value: 'copy_and_paste' },
    { label: 'Use Example Sequences', icon: 'pi pi-table', value: 'use_example' },
  ];
  selectedInputMethod: any | null = 'copy_and_paste'; //this.inputMethods[0];

  exampleData: ExampleData[] = [];
  selectedExample: any | null = this.exampleData[0];

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
    private hcaptchaService: NgHcaptchaService
  ) { }

  ngOnInit() {
    this.getExampleData();
    this.highTrafficMessage = [
      { severity: 'info', detail: 'Due to the overwhelming popularity of the CLEAN tool, we are temporarily unable to predict EC numbers for new sequences. As we increase our capacity, please feel free to explore the tool with the example data we have provided, and visit us again soon!' },
    ];
    // console.log(this.exampleData);
  }

  getExampleData() {
    let tempExampleData: ExampleData = {label: 'price149', data: ''}
    this.httpClient.get('assets/price.fasta', { responseType: 'text' })
      .subscribe(
        data => {
          tempExampleData.data = data;
          this.exampleData.push(tempExampleData);
          this.selectedExample = this.exampleData[0];
          this.selectExample();
        }
      );
  }

  selectExample() {
    this.isValid = true;
    this.trackingService.trackSelectExampleData(this.selectedExample.label);
  }

  makeExampleValid() {
    if (this.selectedInputMethod == 'copy_and_paste') {
      this.isValid = false;
    }
  }

  clearAll() {
    this.sequenceData = '';
  }

  submitData() {
    // console.log(this.realSendData);
    // if the user uses example file, return precompiled result
    // else send sequence to backend, jump to results page
    if (this.selectedInputMethod == 'use_example') {
      this._sequenceService.getExampleResponse(this.selectedExample.label)
        .subscribe( data => {
          this.router.navigate(['/results', data.jobId, '149']);
        });
    } else {
      this.hcaptchaService.verify().pipe(
        switchMap((data) => {
          this.realSendData.captcha_token = data;
          return this._sequenceService.getResponse(this.realSendData);
        })
      ).subscribe(
        (data) => {
          this.router.navigate(['/results', data.jobId, String(this.seqNum)]);
        },
        (error) => {
          // TODO replace this with a call to the message service, and display the correct error message
          console.error('Error getting contacts via subscribe() method:', error);
        }
      );
    }
  }

  hasDuplicateHeaders(array: string[]) {
    return (new Set(array)).size !== array.length;
  }

  isInvalidFasta(seq: string) {
    return this.validAminoAcid.test(seq);
  }

  enterEmail() {
    this.realSendData.user_email = this.userEmail;
  }

  submitValidate() {
    let splitString: string[] = this.sequenceData.split('>').slice(1);
    let headers: string[] = [];
    let shouldSkip: boolean = false;
    this.hasChanged = true;
    this.seqNum = 0;
    this.realSendData.input_fasta = [];

    if (splitString.length == 0) {
      this.validationText = 'Please input your sequence.';
      this.isValid = false;
      shouldSkip = true;
      return
    }

    if (splitString.length > this.maxSeqNum) {
      this.validationText = 'Please enter no more than ' + this.maxSeqNum + ' sequences.';
      this.isValid = false;
      shouldSkip = true;
      return
    }

    splitString.forEach((seq: string) => {
      let singleSeq: SingleSeqData = {
        header: '',
        sequence: ''
      };
      this.seqNum += 1;
      let aminoHeader: string = seq.split('\n')[0];
      let aminoSeq: string = seq.split('\n').slice(1).join('');

      let warningMessageHeader: string;
      if (aminoHeader.length > 30) {
        warningMessageHeader = aminoHeader.slice(0,30) + '...';
      }
      else {
        warningMessageHeader = aminoHeader;
      }

      if (aminoSeq.slice(-1) == '*') {
        aminoSeq = aminoSeq.slice(0,-1);
      }
      aminoSeq = aminoSeq.toUpperCase();

      if (aminoHeader.length == 0) {
        this.validationText = 'Header cannot be empty!';
        this.isValid = false;
        shouldSkip = true;
        return
      }

      headers.push(aminoHeader);
      singleSeq.header = aminoHeader;
      singleSeq.sequence = aminoSeq;
      this.realSendData.input_fasta.push(singleSeq);

      if (this.isInvalidFasta(aminoSeq)) {
        this.validationText = 'Invalid sequence: ' + warningMessageHeader + ', This is not a valid fasta file format!';
        this.isValid = false;
        shouldSkip = true;
        return
      }

      if (aminoSeq.length > 1022) {
        this.validationText = 'Invalid sequence: ' + warningMessageHeader + ', sequence Length is greater than 1022!';
        this.isValid = false;
        shouldSkip = true;
        return
      }

      if (aminoSeq.length == 0) {
        this.validationText = 'Invalid sequence: ' + warningMessageHeader + ', sequence Length is 0.';
        this.isValid = false;
        shouldSkip = true;
        return
      }
    });

    if (this.hasDuplicateHeaders(headers)) {
      this.validationText = 'The file contains duplicated sequence identifier.';
      this.isValid = false;
      shouldSkip = true;
      return
    }
    if (!shouldSkip) {
      this.validationText = 'Valid No. of Sequences: ' + this.seqNum + ' Sequences';
      this.isValid = true;
    }
  }
}
