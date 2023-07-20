import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { PostResponse, FileUploadResponse } from './models';
import { EnvironmentService } from "./services/environment.service";
import { AnalyzeRequestBody, DefaultService, Molecule } from "./api/mmli-backend/v1";

@Injectable({
  providedIn: 'root'
})
export class ChemScraperService {

  responseFromExample: PostResponse = {
    jobId: "example_PDF",
    submitted_at: "2020-01-01 10:10:10"
  };

  get env() {
    return this.envService.getEnvConfig();
  }

  constructor(private http: HttpClient, private envService: EnvironmentService, private apiService: DefaultService) {  }

  getExampleResponse(dataLabel: string): Observable<PostResponse>{
    this.responseFromExample.jobId = dataLabel;
    const respond = of(this.responseFromExample);
    return respond;
  }

  analyzeDocument(requestBody: AnalyzeRequestBody): Observable<PostResponse>{
    return this.apiService.analyzeDocumentsChemscraperAnalyzePost(requestBody);
  }

  fileUpload(formData: FormData, jobID: string): Observable<FileUploadResponse>{
    if(jobID && jobID == "") {
      //return this.http.post<FileUploadResponse>(this.SERVER_URL + 'upload', formData); //should return a jobID
      return this.apiService.uploadFileBucketNameUploadPost('chemscraper', formData.get('file') as Blob);
    } else {
      //return this.http.post<FileUploadResponse>(this.SERVER_URL + 'upload', formData, { params: params }); //should return a jobID
      return this.apiService.uploadFileBucketNameUploadPost('chemscraper', formData.get('file') as Blob, jobID);
    }
  }

  getResultStatus(jobID: string): Observable<string>{
    //return this.http.get<string>(this.SERVER_URL + 'result-status/' + jobID)
    return this.apiService.getResultStatusBucketNameResultStatusJobIdGet('chemscraper', jobID);
  }

  getResult(jobID: string): Observable<Molecule[]>{
    //return this.http.get<Molecule[]>(this.SERVER_URL + 'results/' + jobID);
    return this.apiService.getResultsBucketNameResultsJobIdGet('chemscraper', jobID);
  }

  getError(jobID: string): Observable<string>{
    //return this.http.get<string>(this.SERVER_URL + 'errors/' + jobID);
    return this.apiService.getErrorsBucketNameErrorsJobIdGet('chemscraper', jobID);
  }

  getInputPDf(jobID: string): Observable<string[]>{
    //return this.http.get<string[]>(this.SERVER_URL + 'inputs/' + jobID);
    return this.apiService.getInputFileBucketNameInputsJobIdGet('chemscraper', jobID);
  }
}
