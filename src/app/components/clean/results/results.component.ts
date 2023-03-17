import { HttpClient } from '@angular/common/http';
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
  sendJobID: string | undefined;
  downloadRows: string[][] = [['Identifier', 'Predicted EC Number']];
  exampleResponse: string;
  
  constructor(private router: Router, private _resultService: ResultService, private httpClient: HttpClient) {
    
  }

  ngOnInit(): void {
    this.sendJobID = window.location.href.split('/').at(-1);
    if (this.sendJobID != 'price150'){
      this.getResult();
    }
    else {
      this.getResponse = {
        jobId: "price150",
        url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
        status: "COMPLETE",
        created_at: "2020-01-01 10:10:10",
        results: []
      };
      this.getExampleResult();
    }
    
  }
    
  // goToConfiture(): void {
  //   window.open('http://localhost:4200/configuration', '_blank')?.focus();
  // }

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

  parseExampleResult(): void {
    this.exampleResponse.split('\n').forEach((seq: string) => {
      let temp: PredictionRow = {
        sequence: '',
        ecNumbers: [],
        score: []
      };
      temp.sequence = seq.split(',')[0];
      seq.split(',').slice(1).forEach((ecNumAndScore: string) => {
        temp.ecNumbers.push(ecNumAndScore.split('/')[0]);
        temp.score.push(Number(ecNumAndScore.split('/')[1]));
      });
      this.rows.push(temp);
    });
  }

  getResult(): void {
    this.timeInterval = this._resultService.getResult(Number(this.sendJobID))
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

  getExampleResult(): void {
    if (this.sendJobID == 'price150') {
      this.httpClient.get('assets/price_maxsep.csv', { responseType: 'text' })
      .subscribe(
        data => {
          this.exampleResponse = data;
          this.parseExampleResult();
          this.contentLoaded = true;
        }
      );
    }
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
    var anchor = document.createElement("a");
    anchor.download = this.sendJobID + '.csv';
    // window.open(url);
    anchor.href = url;
    anchor.click();
  }

  copyAndPasteURL(): void {
    console.log('copy and paste url');
  }
  ngOnDestroy(): void {
    this.timeInterval.unsubscribe();
  }

}
