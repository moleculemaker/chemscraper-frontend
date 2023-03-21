import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

import { PostResponse, PostSeqData, ExampleData } from './models';

@Injectable({
  providedIn: 'root'
})
export class SequenceService {

  // jobId: number = 3;

  responseFromBackend: PostResponse = {
    jobId: "1",
    url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    status: 1, 
    created_at: "2020-01-01 10:10:10"
  };

  responseFromExample: PostResponse = {
    jobId: "price149",
    url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    status: 1, 
    created_at: "2020-01-01 10:10:10"
  };

  private _url: string = 'https://jobmgr.mmli1.ncsa.illinois.edu/api/v1' + '/job/submit';

  constructor(private http: HttpClient) { }

  // getResponse(sequenceData: PostSeqData): Observable<PostResponse>{
  //   const respond = of(this.responseFromBackend);
  //   const dealyRespond = respond.pipe(delay(200));
  //   return dealyRespond;
  // }

  getExampleResponse(dataLabel: string): Observable<PostResponse>{
    this.responseFromExample.jobId = dataLabel;
    const respond = of(this.responseFromExample);
    return respond;
  }


  getResponse(sequenceData: PostSeqData): Observable<PostResponse>{
    return this.http.post<PostResponse>(this._url, sequenceData); //should return a jobID
  }
}
