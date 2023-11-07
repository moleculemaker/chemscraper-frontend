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
import { PdfViewerDialogServiceComponent } from '../pdf-viewer-dialog-service/pdf-viewer-dialog-service.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
  providers: [DialogService]
})
export class ResultsComponent {
  showMarvinJsEditor: boolean;
  marvinJsSmiles: string = '';

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

  pages_count: number = 0;
  ref: DynamicDialogRef;

  @ViewChild('resultsTable') resultsTable: Table;

  constructor(
    private router: Router,
    private _resultService: ResultService,
    private httpClient: HttpClient,
    private _chemScraperService: ChemScraperService,
    private sanitizer: DomSanitizer,
    private dialogService: DialogService
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

  getResult(){
    let jobID = window.location.href.split('/').at(-1);
    if(jobID){
      timer(0, 10000).pipe(
        switchMap(() => this._chemScraperService.getResultStatus(jobID ? jobID : "example_PDF")),
        takeWhile(() => this.pollForResult)
      ).subscribe(
        (jobStatus) => {
          if (jobStatus.phase == "completed") {
            this.updateStatusStage(1);
            this.pollForResult = false;
            if(jobID)
            this._chemScraperService.getResult(jobID).subscribe(
              (data) => {
                data.forEach(molecule => {
                  molecule.structure = this.sanitizer.bypassSecurityTrustHtml(this.modifySvg(molecule.structure.toString()));
                })
                this.molecules = data;
                this.pages_count = Math.max(...this.molecules.map(molecule => parseInt(molecule.page_no)))

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
          } else if (jobStatus.phase == "error") {
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
    // if(event.data){
    //   this.pdfViewerComponent.highlightMolecule(event.data.id, parseInt(event.data.page_no));
    //   const input_pdf_container = document.getElementById("input_pdf_container");
    //   if(input_pdf_container){
    //     input_pdf_container.scrollBy(-10000, -10000);
    //     input_pdf_container.scrollBy((parseInt(event.data.minX) * 72.0) / 300, (parseInt(event.data.minY) * 72.0) / 300);
    //   }
    // }
  }

  onRowUnselected(event: any){
    // if(event.data){
    //   this.pdfViewerComponent.highlightMolecule(-1);
    // }
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
        // this.pdfViewerComponent.highlightMolecule(this.selectedMolecule.id, parseInt(this.selectedMolecule.page_no));
      }
    });
  }

  openMarvinjsEditor($event: MouseEvent) {
    this.showMarvinJsEditor = true;
  }

  closeMarvinjsEditor($event: MouseEvent) {
    this.showMarvinJsEditor = false;
  }

  filterBySmiles(molecules: Molecule[], smiles: string) {
    return molecules.filter((molecule) => molecule.SMILE?.includes(smiles));
  }

  modifySvg(svgString: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElem = doc.querySelector('svg');

    if (svgElem) {
      // Extract width and height values
      const width = svgElem.getAttribute('width');
      const height = svgElem.getAttribute('height');

      // Remove width and height attributes
      svgElem.removeAttribute('width');
      svgElem.removeAttribute('height');

      // Add viewBox attribute
      if (width && height && !svgElem.getAttribute('viewBox')) {
        svgElem.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }

      // Convert modified SVG back to string
      const serializer = new XMLSerializer();
      return serializer.serializeToString(svgElem);
    }

    return svgString; // return original if modifications failed
  }

  OpenPDFOverlay(moleculeId: number){
    this.ref = this.dialogService.open(PdfViewerDialogServiceComponent, {
      height:'80%',
      data:{
        pdfURL: this.currentPDF,
        highlightBoxes: this.highlightBoxes,
        highlightedMoleculeId: moleculeId,
        pageNumber: parseInt(this.molecules[moleculeId].page_no)
      }
    });
  }

  similaritySort(smile: string){
    if(this.jobID)
    this._chemScraperService.getSimilaritySortedOrder(this.jobID, smile).subscribe(
      (response) => {
        this.molecules.sort((data1: Molecule, data2: Molecule) => {
          const indexA = response.indexOf(data1.id);
          const indexB = response.indexOf(data2.id);
          return indexA - indexB;
        });
        this.goToRow(0);
      }
    );
  }

  searchStructure(){
    this.similaritySort(this.marvinJsSmiles);
    this.showMarvinJsEditor = false;
  }

}


