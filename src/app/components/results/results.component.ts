import { Component } from '@angular/core';
import { ResultService } from 'src/app/result.service';
import { interval } from "rxjs/internal/observable/interval";
import { Subscription } from 'rxjs';
import { startWith, switchMap } from "rxjs/operators";

import { PredictionRow, PullingResponse, SingleSeqResult, SeqResult } from '../../models';


@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent {
  timeInterval: Subscription;
  contentLoaded: boolean = false;
  // subscribe to result service to get the predictionRow. after receive, set contentLoaded to false.
  rows: PredictionRow[] = [];
  getResponse: PullingResponse;
  failedJob: boolean = false;
  jobID: string;
  sendJobID: number;
  constructor(private _resultService: ResultService) {
    
  }

  ngOnInit(): void {
    // this.activatedRoute.queryParams.subscribe(params => {
    //   const userId = params['id'];
    //   console.log(userId);
    // });
    this.sendJobID = Number(window.location.href.split('/').at(-1));
    console.log('parse jobID: ', this.sendJobID);
    this.getResult();
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
    this._resultService.getResult(this.sendJobID)
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

  ngOnDestroy(): void {
    this.timeInterval.unsubscribe();
  }

}
