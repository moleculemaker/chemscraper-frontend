export interface PredictionRow {
  sequence: string;
  ecNumbers: string[];
  score: number;
}

export interface SingleSeqResult {
  ecNumber: string;
  score: number;
}

export interface SeqResult {
  sequence: string;
  result: SingleSeqResult[];
}

export interface PostResponse {
  jobId: string;
  url: string;
  status: number;
  created_at: string;
}

export interface PullingResponse {
  jobId: string;
  url: string;
  status: string;
  created_at: string;
  results: SeqResult[];
}
