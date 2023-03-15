export interface PredictionRow {
  sequence: string;
  ecNumbers: string[];
  score: number[];
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

export interface PostSeqData {
  input_fasta: SingleSeqData[];
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
