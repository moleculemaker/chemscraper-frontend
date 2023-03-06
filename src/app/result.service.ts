import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PredictionRow } from './models';

@Injectable({
  providedIn: 'root'
})
export class ResultService {

  _url: string = '/backendAPI/getResult'
  private dummyResult: PredictionRow[] = [
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
  ]

  constructor(private http: HttpClient) { }

  getResult() {
    return this.dummyResult;
  }

  // getResponse(sequence: string[]): Observable<number>{
  //   return this.http.post<number>(this._url, sequence) //should return a jobID
  // }
  // getResult(jobID: number) {
  //   return this.http.get(this._url, jobID);
  // }
}
