export interface PredictionRow {
  sequence: string;
  ecNumbers: string[];
  score: number[];
  level: string[];
}

export interface ExampleData {
  label: string;
  data: string;
}

export interface SingleSeqResult {
  ecNumber: string;
  score: number;
}

export interface SeqResult {
  sequence: string;
  result: SingleSeqResult[];
}

export interface SingleSeqData {
  header: string;
  sequence: string;
}

export interface ChemScraperAnalyzeRequestBody {
  jobId: string;
  user_email: string;
  captcha_token: string;
  fileList: string[];
}

export interface PostResponse {
  jobId: string;
  molecules: Molecule[];
  created_at: string;
}

export interface Molecule {
  doc_no: string;
  file_path: string;
  page_no: string;
  name: string;
  SMILE: string;
  structure: string;
  minX: string;
  minY: string;
  width: string;
  height: string;
  PubChemCID: string;
  molecularFormula: string;
  molecularWeight: string;
  chemicalSafety: string[];
  Description: string;
}

export interface FileUploadResponse {
  jobID: string;
  uploaded_at: string;
}

export interface PollingResponseStatus {
  jobId: string;
  url: string;
  status: string;
  created_at: string;
}

export interface PollingResponseResult {
  jobId: string;
  url: string;
  status: string;
  created_at: string;
  results: SeqResult[];
}

export interface HighlightBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Molecule {
  name: string;
  structure: string;
  SMILE: string;
}

