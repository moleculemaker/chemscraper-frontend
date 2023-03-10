import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SequenceService } from 'src/app/sequence.service';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent {
  sequenceData: string = '>seq1\nasdfasdfkjasdfkladf\n>seq2\nsoidfjowierj\n>seq3\nasoidfjosadifoweir';
  validationText: string = 'Click Validate button to validate sequence.';
  isValid: boolean = false;
  jobID: number;
  sendData: string[] = [];
  seqNum: number = 0;
  private validAminoAcid= new RegExp("[^GPAVLIMCFYWHKRQNEDST]", "i");
  
  constructor(private router: Router, private _sequenceService: SequenceService) {}

  submitData() {
    if (this.isValid) {
      // send sequence to backend
      // jump to results page
      // this.router.navigateByUrl('/results');
      this.jobID = this._sequenceService.getResponse(this.sendData);
      // this._sequenceService.getResponse(this.sendData)
      //   .subscribe(data => this.jobID = data);
      this.router.navigate(['/results', this.jobID]);
      
    }
    else {
      this.router.navigateByUrl('/configuration');
    }
  }

  hasDuplicateHeaders(array: string[]) {
    return (new Set(array)).size !== array.length;
  }

  isInvalidFasta(seq: string) {
    if(this.validAminoAcid.test(seq)) {
      return true;
    }
   return false;
  }

  submitValidate () {
    let splitString: string[] = this.sequenceData.split('>').slice(1);
    let headers: string[] = [];
    let shouldSkip: boolean = false;
    this.seqNum = 0;

    splitString.forEach((seq:string) => {
      this.seqNum += 1;
      headers.push(seq.split('\n')[0]);
      
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
