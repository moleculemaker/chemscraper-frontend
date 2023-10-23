import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

import { PostResponse, ChemScraperAnalyzeRequestBody, ExampleData, FileUploadResponse, Molecule, ExportRequestBody } from './models';
import {EnvironmentService} from "./services/environment.service";

@Injectable({
  providedIn: 'root'
})
export class ChemScraperService {

  responseFromExample: PostResponse = {
    jobId: "example_PDF",
    submitted_at: "2020-01-01 10:10:10"
  };

  private SERVER_URL = this.env.hostname + this.env.basePath + '/chemscraper/';

  get env() {
    return this.envService.getEnvConfig();
  }

  constructor(private http: HttpClient, private envService: EnvironmentService) {  }

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

  getResultStatus(jobID: string): Observable<string>{
    return this.http.get<string>(this.SERVER_URL + 'result-status/' + jobID)
  }

  getResult(jobID: string): Observable<Molecule[]>{
    return this.http.get<Molecule[]>(this.SERVER_URL + 'results/' + jobID);
  }

  getError(jobID: string): Observable<string>{
    return this.http.get<string>(this.SERVER_URL + 'errors/' + jobID);
  }

  getInputPDf(jobID: string): Observable<string[]>{
    return this.http.get<string[]>(this.SERVER_URL + 'inputs/' + jobID);
  }

  exportFiles(requestBody: ExportRequestBody): Observable<Blob> {
    return this.http.post<Blob>(this.SERVER_URL + 'export-results', requestBody, { responseType: 'blob' as 'json' });
  }

  getSimilaritySortedOrder(jobID: string, smile: string): Observable<number[]>{
    let params = new HttpParams();
    params = params.append('smile_string', smile);
    return this.http.get<number[]>(this.SERVER_URL + 'similarity-sorted-order/' + jobID, { params: params });
  }

}
