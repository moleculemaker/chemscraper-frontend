import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, delay, timer, Subscription, Subject } from 'rxjs';
import { PullingResponse } from './models';
import { switchMap, tap, share, retry, takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ResultService {

  private resuts$: Observable<PullingResponse>;
  private stopPolling = new Subject();
  _url: string = '/backendAPI/getResult';
  dummyChooseArray: number[] = [0, 0, 0, 0, 0, 0, 0];
  private dummyRunningResult: PullingResponse = {
    jobId: "b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    status: "RUNNING",
    created_at: "2020-01-01 10:10:10",
    results: []
  };

  private dummyFailedResult: PullingResponse = {
    jobId: "b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    status: "FAILED",
    created_at: "2020-01-01 10:10:10",
    results: []
  };

  private dummyCompleteResult: PullingResponse = {
    jobId: "b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    status: "COMPLETE",
    created_at: "2020-01-01 10:10:10",
    results: [
      {
        sequence: "header1",
        result: [
          {
            ecNumber: "EC:1.3.8.1",
            score: 10.3423
          },
          {
            ecNumber: "EC:1.3.8.2",
            score: 5.8673
          }
        ]
      },
      {
        sequence: "header2",
        result: [
          {
            ecNumber: "EC:1.3.8.3",
            score: 2.4593
          }
        ]
      }
    ]
  };

  constructor(private http: HttpClient) {
    this.resuts$ = timer(1, 2000).pipe(
      switchMap((x) =>
        this.tempSelectResult(this.dummyChooseArray[x])
      ),
      retry(),
      takeUntil(this.stopPolling)
    );
  }

  tempSelectResult(choseResponse: number): Observable<PullingResponse> {
    const runningRespond = of(this.dummyRunningResult);
    const dealyRunningRespond = runningRespond.pipe(delay(200));

    const failedResult = of(this.dummyFailedResult);
    const dealyFailedRespond = failedResult.pipe(delay(200));

    const completeResult = of(this.dummyCompleteResult);
    const dealyCompleteResult = completeResult.pipe(delay(200));

    if (choseResponse == 0) {
      return dealyRunningRespond;
    }
    else if (choseResponse == 1) {
      return dealyCompleteResult;
    }
    else {
      return dealyFailedRespond;
    }
  }

  getResult(responseNumber: number): Observable<PullingResponse> {
    this.dummyChooseArray.push(responseNumber);
    return this.resuts$;
  }

  gotEndResult() {
    this.stopPolling.next(1);
  }

  ngOnDestroy() {
    this.stopPolling.next(1);
  }

  // getResponse(sequence: string[]): Observable<number>{
  //   return this.http.post<number>(this._url, sequence) //should return a jobID
  // }
  // getResult(jobID: number) {
  //   return this.http.get(this._url, jobID);
  // }
}
