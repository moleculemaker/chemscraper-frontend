import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { ResultService } from 'src/app/result.service';
import { interval } from "rxjs/internal/observable/interval";
import { Subscription, timer } from 'rxjs';
import { finalize, startWith, switchMap, takeWhile } from "rxjs/operators";
import { Router } from '@angular/router';
import { MenuItem, Message } from 'primeng/api';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PredictionRow, PollingResponseResult, PollingResponseStatus, SingleSeqResult, SeqResult, HighlightBox, Molecule } from '../../../models';
import { ChemScraperService } from 'src/app/chemscraper.service';
import { PdfViewerComponent } from '../pdf-viewer/pdf-viewer.component';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent {
  // subscribe to result service to get the predictionRow. after receive, set contentLoaded to false.
  timeInterval: Subscription;
  contentLoaded: boolean = false;
  pdfURLs: string[] = [];
  currentPDF: string = "";
  currentPDFName: string = "";

  rows: PredictionRow[] = [];
  getResponse: PollingResponseResult;
  failedJob: boolean = false;
  jobID: string | undefined;
  downloadRows: string[][] = [['Identifier', 'Predicted EC Number']];
  statusResponse: PollingResponseStatus;
  useExample: boolean = false;
  preComputedMessage: Message[];
  jobFailedMessage: Message[];
  stages: MenuItem[];
  activeStage: number;

  fileNames: string[];
  selectedFile: string;
  splitView: boolean = true;
  highlightBoxes: HighlightBox[][];
  searchText: string;
  molecules: any[];
  filterPanelVisible: boolean = false;

  tableFilterStateOptions: any[] = [{label: 'Off', value: 'off'}, {label: 'On', value: 'on'}];
  tableFilterValue: string = 'off';

  pollForResult: boolean = true;
  selectedMolecule!: Molecule;

  firstRowIndex: number = 0;

  @ViewChild('resultsTable') resultsTable: Table;

  constructor(
    private router: Router,
    private _resultService: ResultService,
    private httpClient: HttpClient,
    private _chemScraperService: ChemScraperService,
    private sanitizer: DomSanitizer
  ) { }

  @ViewChild(PdfViewerComponent) pdfViewerComponent: PdfViewerComponent;

  ngOnInit(): void {
    this.preComputedMessage = [
      { severity: 'info', detail: 'This is a pre-computed result for the example data. To see real-time computation, click the "Run a new Request" button and use the "Copy and Paste" input method.' },
      // { severity: 'info', detail: 'This is a pre-computed result for the example data. Real-time computation is currently disabled due to high demand, but please visit us again soon!' },
    ];
    this.jobFailedMessage = [
      { severity: 'error', detail: 'Job failed possibly due to incorrect input or intermittent issues. Please use the “Run a new Request” button above to try again, or click the feedback link at the bottom of the page to report a problem.'}
    ]

    this.jobID = window.location.href.split('/').at(-1);

    this.stages = [
      {
          label: 'Running ChemScraper Job'
      },
      {
          label: 'Fetching External Data'
      },
      {
        label: 'Execution Complete, Showing Results'
    }
    ];
    this.activeStage = 0;

    // Temp files names
    this.fileNames = [];

    this.molecules = [];

    // Temp file read function
    // this.process_example_file();

    this.getResult();

  }

  updateStatusStage(currentStage: number){
    this.activeStage = currentStage;
    const listItems = Array.from(document.querySelectorAll('#LoadingStages ul li'));
    // console.log(listItems);
    listItems.forEach((childElement, childIndex) => {
      if(childIndex < currentStage){
        const stageElement = Array.from(childElement.querySelectorAll('a .p-steps-number'));
        const firstElement = stageElement[0];
        firstElement.classList.add('completed-stage')
      }
    })
    if(currentStage == this.stages.length){
      // this.useExample = true;
    }

  }

  copyAndPasteURL(): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = window.location.href;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  ngOnDestroy(): void {
    this.timeInterval.unsubscribe();
  }

  toggleSplitView() {
    this.splitView = !this.splitView;
  }

  filterResults(){
    this.filterPanelVisible = true;
  }

  sortResults(){

  }

  selectRow(event: Event){
    // event.stopPropagation();
  }

  process_example_file(){
    this.httpClient.get('assets/example_PDF.tsv', { responseType: 'text' }).pipe(
      finalize(() => {
        // console.log(this.molecules);

      })
    ).subscribe(data => {
      const lines = data.split('\n');
      let documentIndex = 0;
      let documentString = '';
      let page = 0;
      for(const line of lines){
        const columns = line.split('\t');
        // console.log(columns);
        if(columns[0] == 'D'){
          documentIndex = parseInt(columns[1]);
          documentString = columns[2];
          page = 0;
        } else if(columns[0] == 'P'){
          page = parseInt(columns[1]);
        } else if(columns[0] == 'SMI'){
          if(documentIndex > 0 && page > 0){
            this.molecules.push({
              id: String(documentIndex) + String(page) + columns[2],
              name: `Molecule name`,
              structure: `Structure`,
              SMILE: columns[2],
              document: documentString,
              page: String(page),
              pubchemCID: `PubChem CID`,
              confidence: `Confidence Score`,
            });
            this.molecules.forEach(molecule => {
              molecule.structure = `<?xml version='1.0' encoding='iso-8859-1'?>
              <svg version='1.1' baseProfile='full'
                            xmlns='http://www.w3.org/2000/svg'
                                    xmlns:rdkit='http://www.rdkit.org/xml'
                                    xmlns:xlink='http://www.w3.org/1999/xlink'
                                xml:space='preserve'
              width='120px' height='120px' viewBox='0 0 120 120'>
              <!-- END OF HEADER -->
              <rect style='opacity:1.0;fill:#FFFFFF;stroke:none' width='120.0' height='120.0' x='0.0' y='0.0'> </rect>
              <path class='bond-0 atom-0 atom-1' d='M 6.4,86.7 L 28.0,74.3' style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path class='bond-1 atom-1 atom-2' d='M 28.0,74.3 L 49.7,86.7' style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path class='bond-2 atom-2 atom-3' d='M 49.7,86.7 L 71.3,74.3' style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path class='bond-3 atom-3 atom-4' d='M 71.3,74.3 L 71.3,49.3' style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path class='bond-3 atom-3 atom-4' d='M 75.0,72.1 L 75.0,51.4' style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path class='bond-4 atom-4 atom-5' d='M 71.3,49.3 L 92.9,36.8' style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path class='bond-5 atom-5 atom-6' d='M 92.9,36.8 L 114.5,49.3' style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path class='bond-5 atom-5 atom-6' d='M 92.9,41.1 L 110.8,51.4' style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path class='bond-6 atom-6 atom-7' d='M 114.5,49.3 L 114.5,74.3' style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path class='bond-7 atom-7 atom-8' d='M 114.5,74.3 L 92.9,86.7' style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path class='bond-7 atom-7 atom-8' d='M 110.8,72.1 L 92.9,82.4' style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path class='bond-8 atom-1 atom-9' d='M 28.0,74.3 L 28.0,49.3' style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path class='bond-9 atom-9 atom-10' d='M 28.0,49.3 L 37.2,44.0' style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path class='bond-9 atom-9 atom-10' d='M 37.2,44.0 L 46.4,38.7' style='fill:none;fill-rule:evenodd;stroke:#7F4C19;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path class='bond-10 atom-9 atom-11' d='M 29.9,48.2 L 7.3,35.2' style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path class='bond-10 atom-9 atom-11' d='M 28.0,51.4 L 5.5,38.4' style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path class='bond-11 atom-8 atom-3' d='M 92.9,86.7 L 71.3,74.3' style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' />
              <path d='M 48.6,86.1 L 49.7,86.7 L 50.7,86.1' style='fill:none;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;' />
              <path d='M 71.3,50.5 L 71.3,49.3 L 72.4,48.7' style='fill:none;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;' />
              <path d='M 91.8,37.4 L 92.9,36.8 L 94.0,37.4' style='fill:none;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;' />
              <path d='M 113.5,48.7 L 114.5,49.3 L 114.5,50.5' style='fill:none;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;' />
              <path d='M 114.5,73.0 L 114.5,74.3 L 113.5,74.9' style='fill:none;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;' />
              <path d='M 94.0,86.1 L 92.9,86.7 L 91.8,86.1' style='fill:none;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;' />
              <path d='M 28.0,50.5 L 28.0,49.3 L 28.5,49.0' style='fill:none;stroke:#000000;stroke-width:2.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;' />
              <path class='atom-10' d='M 50.7 36.6
              Q 51.4 36.8, 51.7 37.2
              Q 52.1 37.6, 52.1 38.2
              Q 52.1 39.2, 51.4 39.8
              Q 50.8 40.3, 49.6 40.3
              L 47.3 40.3
              L 47.3 33.3
              L 49.3 33.3
              Q 50.5 33.3, 51.2 33.7
              Q 51.8 34.2, 51.8 35.1
              Q 51.8 36.2, 50.7 36.6
              M 48.2 34.1
              L 48.2 36.3
              L 49.3 36.3
              Q 50.0 36.3, 50.4 36.0
              Q 50.8 35.7, 50.8 35.1
              Q 50.8 34.1, 49.3 34.1
              L 48.2 34.1
              M 49.6 39.5
              Q 50.3 39.5, 50.7 39.2
              Q 51.1 38.9, 51.1 38.2
              Q 51.1 37.7, 50.6 37.4
              Q 50.2 37.1, 49.5 37.1
              L 48.2 37.1
              L 48.2 39.5
              L 49.6 39.5
              ' fill='#7F4C19'/>
              <path class='atom-10' d='M 53.7 35.2
              L 53.8 35.9
              Q 54.3 35.1, 55.2 35.1
              Q 55.5 35.1, 55.9 35.2
              L 55.7 36.0
              Q 55.3 35.9, 55.0 35.9
              Q 54.6 35.9, 54.3 36.1
              Q 54.1 36.3, 53.8 36.7
              L 53.8 40.3
              L 52.9 40.3
              L 52.9 35.2
              L 53.7 35.2
              ' fill='#7F4C19'/>
              </svg>`
              molecule.structure = this.sanitizer.bypassSecurityTrustHtml(molecule.structure)
            });
          }
        }
      }
    });
    let jobID = window.location.href.split('/').at(-1);
    if(jobID){
      this._chemScraperService.getInputPDf(jobID).subscribe(
        (urls) => {
          this.pdfURLs = urls;
          if(this.pdfURLs.length > 0) {
            this.currentPDF = this.pdfURLs[0];
          }
        }
      );
    }
    this.contentLoaded = true;
  }

  getResult(){
    let jobID = window.location.href.split('/').at(-1);
    if(jobID){
      timer(0, 10000).pipe(
        switchMap(() => this._chemScraperService.getResultStatus(jobID ? jobID : "example_PDF")),
        takeWhile(() => this.pollForResult)
      ).subscribe(
        (response) => {
          if (response == "Ready") {
            this.updateStatusStage(1);
            this.pollForResult = false;
            if(jobID)
            this._chemScraperService.getResult(jobID).subscribe(
              (data) => {
                this.molecules = data;
                this.updateStatusStage(2);

                this.getHighlightBoxes(1);

                if(jobID)
                this._chemScraperService.getInputPDf(jobID).subscribe(
                  (urls) => {
                    this.pdfURLs = urls;
                    if(this.pdfURLs.length > 0) {
                      this.currentPDF = this.pdfURLs[0];
                      const pdfName = this.currentPDF.split("/").pop();
                      if(pdfName){
                        this.currentPDFName = pdfName;
                        this.fileNames.push(pdfName);
                      }
                      this.contentLoaded = true;
                    }
                  }
                );
              }
            );
          } else if (response == "Error") {
            if(jobID)
            this._chemScraperService.getError(jobID).subscribe(
              (response) => {
                console.log(response);
                this.pollForResult = false;
              }
            );
          } else {
            console.log("Job execution underway");
          }
        }
      );
    }

  }

  getHighlightBoxes(doc_no: number){
    this.highlightBoxes = []
    let filteredMolecules = this.molecules.filter(molecule => molecule.doc_no === doc_no.toString());
    for(const molecule of filteredMolecules){
      if(!this.highlightBoxes[parseInt(molecule.page_no)]){
        while(this.highlightBoxes.length < parseInt(molecule.page_no)){
          this.highlightBoxes.push([]);
        }
        this.highlightBoxes[parseInt(molecule.page_no)] = [];
      }
      this.highlightBoxes[parseInt(molecule.page_no)].push({
        moleculeId: molecule.id,
        moleculeName: molecule.name,
        x: parseInt(molecule.minX),
        y: parseInt(molecule.minY),
        width: parseInt(molecule.width),
        height: parseInt(molecule.height)
      });
    }
  }

  onRowSelected(event: any) {
    if(event.data){
      this.pdfViewerComponent.highlightMolecule(event.data.id, parseInt(event.data.page_no));
      const input_pdf_container = document.getElementById("input_pdf_container");
      if(input_pdf_container){
        input_pdf_container.scrollBy(-10000, -10000);
        input_pdf_container.scrollBy((parseInt(event.data.minX) * 72.0) / 300, (parseInt(event.data.minY) * 72.0) / 300);
      }
    }
  }

  onRowUnselected(event: any){
    if(event.data){
      this.pdfViewerComponent.highlightMolecule(-1);
    }
  }

  goToRow(rowIndex: number) {
    // Read the current number of rows per page from the table
    const rowsPerPage = this.resultsTable.rows;

    // Calculate the start index of the page
    this.firstRowIndex = Math.floor(rowIndex / rowsPerPage) * rowsPerPage;

    // Scroll to the specific row within the page
    setTimeout(() => {
      const rowElements = document.querySelectorAll('.p-datatable-tbody > tr');
      if (rowElements && rowIndex < this.molecules.length) {
        rowElements[rowIndex % rowsPerPage].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        this.selectedMolecule = this.molecules[rowIndex];
        this.pdfViewerComponent.highlightMolecule(this.selectedMolecule.id, parseInt(this.selectedMolecule.page_no));
      }
    });
  }

}
