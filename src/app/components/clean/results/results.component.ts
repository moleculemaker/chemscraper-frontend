import { Component } from '@angular/core';
import { ResultService } from 'src/app/result.service';

import { PredictionRow } from '../../../models';


@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent {
  contentLoaded: boolean = false;
  // subscribe to result service to get the predictionRow. after receive, set contentLoaded to false.
  rows: PredictionRow[] = [];

  constructor(private _resultService: ResultService) {}

  ngOnInit(): void {
    this.getResult();
  }

  getResult(): void {
    this.rows = this._resultService.getResult();
    this.contentLoaded = true;
  }

  copyAndPasteURL(): void {
    console.log('copy and paste url');
  }
}
