import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SequenceService } from 'src/app/sequence.service';


import { PostResponse, PostSeqData, SingleSeqData, ExampleData } from '../../../models';
import { ResultsComponent } from '../results/results.component';

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

  inputMethods = [
    { label: 'Copy and Paste', icon: 'pi pi-copy', value: 'copy_and_paste' },
    { label: 'Use an example Sequence', icon: 'pi pi-table', value: 'use_example' }
  ];
  selectedInputMethod: any | null = 'copy_and_paste'; //this.inputMethods[0];

  exampleData: ExampleData[] = [];
  // exampleData = [
  //   { label: 'H. sapiens amylase', data: '>sp|P69905|HBA_HUMAN Hemoglobin subunit alpha OS=Homo sapiens OX=9606 GN=HBA1 PE=1 SV=2 MVLSPADKTNVKAAWGKVGALVTLAAHLPAEFTPYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTP AVHASLDKFLASVSTVLTSKYR MVLSPADKTNVKALVTLAAHLPAEFTPHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTP' },
  //   { label: 'E. coli TrpCF', data: '>sp|P69905|HBA_HUMAN Hemoglobin subunit alpha OS=Homo sapiens OX=9606 GN=HBA1 PE=1 SV=2 MVLAVHASLDKFLASVSTVLTSKYRPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTP ' },
  // ];
  selectedExample: any | null = this.exampleData[0];

  seqNum: number = 0;
  private validAminoAcid = new RegExp("[^GPAVLIMCFYWHKRQNEDST]", "i");
  realSendData: PostSeqData = {
    input_fasta: []
  };

  constructor(private router: Router, private _sequenceService: SequenceService, private httpClient: HttpClient) { }

  ngOnInit() {
    this.getExampleData();
    // console.log(this.exampleData);
  }

  getExampleData() {
    let tempExampleData: ExampleData = {label: 'price150', data: ''}
    this.httpClient.get('../../../../assets/price.fasta', { responseType: 'text' })
      .subscribe(
        data => {
          tempExampleData.data = data;
          this.exampleData.push(tempExampleData)
        }
      );
  }

  selectExample() {
    this.isValid = true;
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
    // if the user uses example file, return precompiled result
    // else send sequence to backend, jump to results page
    if (this.selectedInputMethod == 'use_example') {
      this._sequenceService.getExampleResponse(this.selectedExample.label)
        .subscribe( data => {
          this.router.navigate(['/results', data.jobId]);
        });
    }
    else {
      this._sequenceService.getResponse(this.realSendData)
      .subscribe(
        data => {
          this.router.navigate(['/results', data.jobId]);
        },
        error => {
          console.error('Error getting contacts via subscribe() method:', error);
        });
    }
    
  }

  hasDuplicateHeaders(array: string[]) {
    return (new Set(array)).size !== array.length;
  }

  isInvalidFasta(seq: string) {
    return this.validAminoAcid.test(seq);
  }

  submitValidate() {
    this.isValidating = true;
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

    if (splitString.length > 10) {
      this.validationText = 'Please enter less than 10 sequences.';
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

      headers.push(aminoHeader);
      singleSeq.header = aminoHeader;
      singleSeq.sequence = aminoSeq;
      this.realSendData.input_fasta.push(singleSeq);

      if (this.isInvalidFasta(aminoSeq)) {
        console.log(seq.split('\n')[0])
        this.validationText = 'Invalid sequence: ' + aminoHeader + ', This is not a valid fasta file format!';
        this.isValid = false;
        shouldSkip = true;
        return
      }

      if (aminoSeq.length > 1022) {
        this.validationText = 'Invalid sequence: ' + aminoHeader + ', sequence Length is greater than 1022!';
        this.isValid = false;
        shouldSkip = true;
        return
      }

      if (aminoSeq.length == 0) {
        this.validationText = 'Invalid sequence: ' + aminoHeader + ', sequence Length is 0.';
        this.isValid = false;
        shouldSkip = true;
        return
      }
    });

    if (this.hasDuplicateHeaders(headers)) {
      this.validationText = 'The file contains duplicated sequence identifier. All of them will be deleted automatically for better results.';
      this.isValid = false;
      shouldSkip = true;
      return
    }
    if (!shouldSkip) {
      this.validationText = 'Valid No. of Sequences: ' + this.seqNum + ' Sequences';
      this.isValid = true;
    }
    this.isValidating = false;
  }

  // log(seq: any) {
  //   console.log(seq);
  // }
}
