import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SequenceService {

  jobId: number = 3;
  private _url: string = 'backend/postSequence';

  constructor(private http: HttpClient) { }

  getResponse(sequence: string[]): number{
    return this.jobId;
  }
  // getResponse(sequence: string[]): Observable<number>{
  //   return this.http.post<number>(this._url, sequence) //should return a jobID
  // }
}
