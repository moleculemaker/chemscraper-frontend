import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { PostResponse, FileUploadResponse } from './models';
import { AnalyzeRequestBody, DefaultService, Molecule, ExportRequestBody } from "./api/mmli-backend/v1";


@Injectable({
  providedIn: 'root'
})
export class ChemScraperService {

  responseFromExample: PostResponse = {
    jobId: "example_PDF",
    submitted_at: "2020-01-01 10:10:10"
  };

  constructor(private apiService: DefaultService) {  }

  getExampleResponse(dataLabel: string): Observable<PostResponse>{
    this.responseFromExample.jobId = dataLabel;
    const respond = of(this.responseFromExample);
    return respond;
  }

  analyzeDocument(requestBody: AnalyzeRequestBody): Observable<PostResponse>{
    return this.apiService.analyzeDocumentsChemscraperAnalyzePost(requestBody);
  }

  fileUpload(formData: FormData, jobID?: string): Observable<FileUploadResponse>{
    const fileData = formData.get('file') as Blob;
    return this.apiService.uploadFileBucketNameUploadPost('chemscraper', fileData, jobID);
  }

  getResultStatus(jobID: string): Observable<string>{
    return this.apiService.getResultStatusBucketNameResultStatusJobIdGet('chemscraper', jobID);
  }

  getResult(jobID: string): Observable<Molecule[]>{
    return this.apiService.getResultsBucketNameResultsJobIdGet('chemscraper', jobID);
  }

  getError(jobID: string): Observable<string>{
    return this.apiService.getErrorsBucketNameErrorsJobIdGet('chemscraper', jobID);
  }

  getInputPDf(jobID: string): Observable<string[]>{
    return this.apiService.getInputFileBucketNameInputsJobIdGet('chemscraper', jobID);
  }

  exportFiles(requestBody: ExportRequestBody): Observable<any> {
    return this.apiService.analyzeDocumentsBucketNameExportResultsPost('chemscraper', requestBody, 'body', false, { httpHeaderAccept: 'application/zip' as any });
  }
}
