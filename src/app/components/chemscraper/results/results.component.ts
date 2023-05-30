import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ResultService } from 'src/app/result.service';
import { interval } from "rxjs/internal/observable/interval";
import { Subscription } from 'rxjs';
import { startWith, switchMap } from "rxjs/operators";
import { Router } from '@angular/router';
import { MenuItem, Message } from 'primeng/api';

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
  jobID: string | undefined;
  downloadRows: string[][] = [['Identifier', 'Predicted EC Number']];
  statusResponse: PollingResponseStatus;
  useExample: boolean = false;
  preComputedMessage: Message[];
  jobFailedMessage: Message[];
  stages: MenuItem[];
  activeStage: number;

  tempIntervalSubscription: Subscription;


  constructor(private router: Router, private _resultService: ResultService, private httpClient: HttpClient) {

  }

  ngOnInit(): void {
    this.preComputedMessage = [
      { severity: 'info', detail: 'This is a pre-computed result for the example data. To see real-time computation, click the "Run a new Request" button and use the "Copy and Paste" input method.' },
      // { severity: 'info', detail: 'This is a pre-computed result for the example data. Real-time computation is currently disabled due to high demand, but please visit us again soon!' },
    ];
    this.jobFailedMessage = [
      { severity: 'error', detail: 'Job failed possibly due to incorrect input or intermittent issues. Please use the “Run a new Request” button above to try again, or click the feedback link at the bottom of the page to report a problem.'}
    ]

    this.jobID = window.location.href.split('/').at(-1);

    this.stages = [
      {
          label: 'Stage1_label'
      },
      {
          label: 'Stage2_label'
      },
      {
          label: 'Stage3_label'
      },
      {
          label: 'Stage4_label'
      },
      {
          label: 'Stage5_label'
      }
    ];
    this.activeStage = 0;
    let count = 0;
    this.tempIntervalSubscription = interval(2000).subscribe(() => {
      this.updateStatusStage(count);
      count += 1;
    });
  }

  updateStatusStage(currentStage: number){
    this.activeStage = currentStage;
    const listItems = Array.from(document.querySelectorAll('#LoadingStages ul li'));
    // console.log(listItems);
    listItems.forEach((childElement, childIndex) => {
      if(childIndex < currentStage){
        const stageElement = Array.from(childElement.querySelectorAll('a .p-steps-number'));
        const firstElement = stageElement[0];
        firstElement.classList.add('completed-stage')
      }
    })
    if(currentStage == this.stages.length){
      this.tempIntervalSubscription.unsubscribe();
      console.log("All stages complete");

    }

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
