import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ResultService } from 'src/app/result.service';
import { interval } from "rxjs/internal/observable/interval";
import { Subscription } from 'rxjs';
import { startWith, switchMap } from "rxjs/operators";
import { Router } from '@angular/router';

import { PredictionRow, PollingResponseResult, PollingResponseStatus, SingleSeqResult, SeqResult } from '../../../models';



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
  getResponse: PollingResponseResult;
  failedJob: boolean = false;
  jobID: string;
  sendJobID: string | undefined;
  downloadRows: string[][] = [['Identifier', 'Predicted EC Number']];
  exampleResponse: string;
  statusResponse: PollingResponseStatus;
  // today: string = '2013-02-01T12:52:34+09:00';
  
  constructor(private router: Router, private _resultService: ResultService, private httpClient: HttpClient) {
    
  }

  ngOnInit(): void {
    this.sendJobID = window.location.href.split('/').at(-1);
    if (this.sendJobID != 'price149'){
      this.getResult();
    }
    else {
      this.getResponse = {
        jobId: "price149",
        url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
        status: "completed",
        created_at: String(Date.now()),
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
    this.timeInterval = this._resultService.getResult(this.sendJobID)
    .subscribe(
      data => {
        console.log(data);
        this.statusResponse = data;
        if (this.statusResponse.status == 'completed' || this.statusResponse.status == 'error') {
          this._resultService.gotEndResult();
        }
        if (this.statusResponse.status == 'error') {
          this.failedJob = true;
        } 
      },
      error => {
        console.error('Error getting contacts via subscribe() method:', error);
      },
      () => {
        this.getResponseResult();
        // console.log(this.contentLoaded);
        // this.parseResult();
        // this.contentLoaded = true;
    });
  }

  getResponseResult(): void {
    this._resultService.getResponse(this.sendJobID)
    .subscribe(
      data => {
        // console.log(data);
        this.getResponse = data;
        this.parseResult();
        this.contentLoaded = true;
        // if (this.getResponse.status == 'completed' || this.getResponse.status == 'error') {
        //   this._resultService.gotEndResult();
        // }
        // if (this.getResponse.status == 'error') {
        //   this.failedJob = true;
        // } 
      },
      error => {
        console.error('Error getting contacts via subscribe() method:', error);
      });
  }

  getExampleResult(): void {
    if (this.sendJobID == 'price149') {
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
    // console.log(this.downloadRows);

    let csvContent = this.downloadRows.map(e => e.join(",")).join("\n");
    // console.log(csvContent);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url= window.URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.download = this.sendJobID + '.csv';
    // window.open(url);
    anchor.href = url;
    anchor.click();
  }

  copyAndPasteURL(): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    // selBox.value = 'https://clean.frontend.mmli1.ncsa.illinois.edu/results/' + this.sendJobID;
    selBox.value = window.location.href;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  ngOnDestroy(): void {
    this.timeInterval.unsubscribe();
  }

}
