import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ResultService } from 'src/app/result.service';
import { interval } from "rxjs/internal/observable/interval";
import { Subscription } from 'rxjs';
import { finalize, startWith, switchMap } from "rxjs/operators";
import { Router } from '@angular/router';
import { MenuItem, Message } from 'primeng/api';

import { PredictionRow, PollingResponseResult, PollingResponseStatus, SingleSeqResult, SeqResult, HighlightBox, Molecule } from '../../../models';

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

  fileNames: string[];
  selectedFile: string;
  splitView: boolean = true;
  highlightBoxes: HighlightBox[][];
  searchText: string;
  molecules: any[];
  filterPanelVisible: boolean = false;

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
    this.tempIntervalSubscription = interval(500).subscribe(() => {
      this.updateStatusStage(count);
      count += 1;
    });

    // Temp files names
    this.fileNames = Array.from({ length: 10 }).map((_, i) => `Item #${i}`);

    // Temporary boxes
    this.highlightBoxes = [[{ x: 200, y: 500, width: 200, height: 50 },],[{ x: 200, y: 200, width: 200, height: 50 },]]

    // Temp Molecules:
    // this.molecules = Array.from({ length: 8 }).map((_, index) => ({
    //   name: `Molecule ${index + 1}`,
    //   structure: `Structure ${index + 1}`,
    //   SMILE: `SMILE ${index + 1}`,
    //   document: `Document ${index + 1}`,
    //   page: `Page ${index + 1}`,
    //   pubchemCID: `PubChem CID ${index + 1}`,
    //   confidence: `Confidence ${index + 1}`,
    // }));
    this.molecules = [];
    // Temp file read function
    this.process_example_file();

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
      this.contentLoaded = true;
      this.useExample = true;
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

  toggleSplitView() {
    this.splitView = !this.splitView;
  }

  filterResults(){
    this.filterPanelVisible = true;
  }

  sortResults(){

  }

  selectRow(event: Event){
    // event.stopPropagation();
  }

  process_example_file(){
    this.httpClient.get('assets/example_response.tsv', { responseType: 'text' }).pipe(
      finalize(() => {
        console.log(this.molecules);

      })
    ).subscribe(data => {
      const lines = data.split('\n');
      let documentIndex = 0;
      let documentString = '';
      let page = 0;
      for(const line of lines){
        const columns = line.split('\t');
        // console.log(columns);
        if(columns[0] == 'D'){
          documentIndex = parseInt(columns[1]);
          documentString = columns[2];
          page = 0;
        } else if(columns[0] == 'P'){
          page = parseInt(columns[1]);
        } else if(columns[0] == 'SMI'){
          if(documentIndex > 0 && page > 0){
            this.molecules.push({
              id: String(documentIndex) + String(page) + columns[2],
              name: `Molecule name`,
              structure: `Structure`,
              SMILE: columns[2],
              document: documentString,
              page: String(page),
              pubchemCID: `PubChem CID`,
              confidence: `Confidence Score`,
            });
          }
        }
      }
    });

  }

}
