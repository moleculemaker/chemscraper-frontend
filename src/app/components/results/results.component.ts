import { Component } from '@angular/core';

import { PredictionRow } from '../../models';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent {
  rows: PredictionRow[] = [
    {
      sequence: 'abc',
      ecNumbers: ['EC1.1.1.1, EC2.2.2.2'],
      score: 0.1
    },
    {
      sequence: 'def',
      ecNumbers: ['EC3.3.3.3, EC4.4.4.4'],
      score: 0.3
    }
  ];
}
