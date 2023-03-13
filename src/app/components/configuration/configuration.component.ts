import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SequenceService } from 'src/app/sequence.service';

import { PostResponse, PostSeqData, SingleSeqData } from '../../models';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent {
  sequenceData: string = '>seq1\nAVLIMCFYWH\n>seq2\nLIMCFYWHKRQNED\n>seq3\nMCFYPARQNEDVLWHKRQ';
  validationText: string = 'Click Validate button to validate sequence.';
  isValid: boolean = false;
  postRespond: PostResponse;
  sendData: string[] = [];
  seqNum: number = 0;
  private validAminoAcid= new RegExp("[^GPAVLIMCFYWHKRQNEDST]", "i");
  realSendData: PostSeqData = {
    input_fasta: []
  };
  
  constructor(private router: Router, private _sequenceService: SequenceService) {}

  submitData() {
    if (this.isValid) {
      // send sequence to backend
      // jump to results page
      // this.router.navigateByUrl('/results');
      // this.jobID = this._sequenceService.getResponse(this.sendData);
      this._sequenceService.getResponse(this.realSendData)
        .subscribe(
          data => {
            console.log(data.jobId);
            this.router.navigate(['/results', data.jobId]);
          },
          error => {
            console.error('Error getting contacts via subscribe() method:', error);             
        });
      
    }
    else {
      this.router.navigateByUrl('/configuration');
    }
  }

  hasDuplicateHeaders(array: string[]) {
    return (new Set(array)).size !== array.length;
  }

  isInvalidFasta(seq: string) {
    return this.validAminoAcid.test(seq);
  }

  submitValidate () {
    let splitString: string[] = this.sequenceData.split('>').slice(1);
    let headers: string[] = [];
    let shouldSkip: boolean = false;
    this.seqNum = 0;
    this.realSendData.input_fasta = [];
    let singleSeq: SingleSeqData = {
      header: '',
      sequence: ''
    };

    splitString.forEach((seq:string) => {
      this.seqNum += 1;
      headers.push(seq.split('\n')[0]);
      singleSeq.header = seq.split('\n')[0];
      singleSeq.sequence = seq.split('\n').slice(1).join('');
      this.realSendData.input_fasta.push(singleSeq);

      if (this.isInvalidFasta(seq.split('\n').slice(1).join(''))) {
        console.log(seq.split('\n')[0])
        this.validationText = 'Invalid sequence: ' + seq.split('\n')[0] + ', This is not a valid fasta file format!';
        this.isValid = false;
        shouldSkip = true;
        return
      }

      if (seq.split('\n').slice(1).join('').length > 1022) {
        this.validationText = 'Invalid sequence: ' + seq.split('\n')[0] + ', sequence Length is greater than 1022!';
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
    
  }
}
