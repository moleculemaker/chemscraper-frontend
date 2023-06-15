import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../environments/environment';

import { PostResponse, ChemScraperAnalyzeRequestBody, ExampleData, FileUploadResponse } from './models';

@Injectable({
  providedIn: 'root'
})
export class ChemScraperService {

  responseFromExample: PostResponse = {
    jobId: "example_PDF",
    molecules: [],
    created_at: "2020-01-01 10:10:10"
  };

  private SERVER_URL: string = environment.apiBaseUrl + '/chemscraper/';

  constructor(private http: HttpClient) { }

  getExampleResponse(dataLabel: string): Observable<PostResponse>{
    this.responseFromExample.jobId = dataLabel;
    const respond = of(this.responseFromExample);
    return respond;
  }

  analyzeDocument(requestBody: ChemScraperAnalyzeRequestBody): Observable<PostResponse>{
    return this.http.post<PostResponse>(this.SERVER_URL + 'analyze', requestBody); //should return a jobID
  }

  fileUpload(formData: FormData, jobID: string): Observable<FileUploadResponse>{
    if(jobID && jobID == "") {
      return this.http.post<FileUploadResponse>(this.SERVER_URL + 'upload', formData); //should return a jobID
    }
    else {
      let params = new HttpParams();
      params = params.append('job_id', jobID);
      return this.http.post<FileUploadResponse>(this.SERVER_URL + 'upload', formData, { params: params }); //should return a jobID
    }
  }
}
