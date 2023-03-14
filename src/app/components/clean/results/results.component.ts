import { Component } from '@angular/core';
import { ResultService } from 'src/app/result.service';
import { interval } from "rxjs/internal/observable/interval";
import { Subscription } from 'rxjs';
import { startWith, switchMap } from "rxjs/operators";
import { Router } from '@angular/router';

import { PredictionRow, PullingResponse, SingleSeqResult, SeqResult } from '../../../models';



@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent {
  // subscribe to result service to get the predictionRow. after receive, set contentLoaded to false.
  timeInterval: Subscription;
  contentLoaded: boolean = false;
  rows: PredictionRow[] = [];
  getResponse: PullingResponse;
  failedJob: boolean = false;
  jobID: string;
  sendJobID: number;
  downloadRows: string[][] = [['Identifier', 'Predicted EC Number']];
  constructor(private router: Router, private _resultService: ResultService) {
    
  }

  ngOnInit(): void {
    this.sendJobID = Number(window.location.href.split('/').at(-1));
    this.getResult();
  }
    
  goToConfiture(): void {
    // this.router.navigateByUrl('/configuration');
    window.open('http://localhost:4200/configuration', '_blank')?.focus();
  }

  parseResult(): void {
    this.jobID = this.getResponse.jobId;
    this.getResponse.results.forEach((seq: SeqResult) => {
      let temp: PredictionRow = {
        sequence: '',
        ecNumbers: [],
        score: []
      };
      temp.sequence = seq.sequence;
      seq.result.forEach((ecNum: SingleSeqResult) => {
        temp.ecNumbers.push(ecNum.ecNumber);
        temp.score.push(ecNum.score);
      });
      this.rows.push(temp);
    })
  }

  getResult(): void {
    this.timeInterval = this._resultService.getResult(this.sendJobID)
    .subscribe(
      data => {
        // console.log(data);
        this.getResponse = data;
        if (this.getResponse.status == 'COMPLETE' || this.getResponse.status == 'FAILED') {
          this._resultService.gotEndResult();
        }
        if (this.getResponse.status == 'FAILED') {
          this.failedJob = true;
        } 
      },
      error => {
        console.error('Error getting contacts via subscribe() method:', error);
      },
      () => {
        this.parseResult();
        this.contentLoaded = true;
    });
    
  }

  downloadResult(): void {
    this.downloadRows = [['Identifier', 'Predicted EC Number']];

    this.rows.forEach(row => {
      let temp = [row.sequence, row.ecNumbers.join(',')]
      this.downloadRows.push(temp);
    });
    console.log(this.downloadRows);

    let csvContent = this.downloadRows.map(e => e.join(",")).join("\n");
    console.log(csvContent);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url= window.URL.createObjectURL(blob);
    window.open(url);
  }

  copyAndPasteURL(): void {
    console.log('copy and paste url');
  }
  ngOnDestroy(): void {
    this.timeInterval.unsubscribe();
  }

}
