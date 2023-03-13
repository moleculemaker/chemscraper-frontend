import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

import { PostResponse } from './models';

@Injectable({
  providedIn: 'root'
})
export class SequenceService {

  // jobId: number = 3;

  responseFromBackend: PostResponse = {
    jobId: "b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    status: 1, 
    created_at: "2020-01-01 10:10:10"
  };

  private _url: string = 'backend/postSequence';

  constructor(private http: HttpClient) { }

  getResponse(sequence: string[]): Observable<PostResponse>{
    const respond = of(this.responseFromBackend);
    const dealyRespond = respond.pipe(delay(1000));
    return dealyRespond;
  }
  // getResponse(sequence: string[]): Observable<PostResponse>{
    
  //   return this.http.post<number>(this._url, sequence); //should return a jobID
  // }
}
